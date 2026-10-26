import csv
from decimal import Decimal
import io
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import require_admin
from app.db.session import get_db
from app.models.event import Event
from app.models.registration import AttendanceStatus, PaymentStatus, Registration
from app.models.team_member import TeamMember
from app.models.user import User
from app.schemas.stats import EventStatItem, OverallStatsResponse

router = APIRouter(prefix="/admin/stats", tags=["Admin Analytics"])


@router.get("/overview", response_model=OverallStatsResponse)
async def get_overview_statistics(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """
    Get aggregated analytics for the main admin dashboard:
    Total events, registrations, revenue, checked-in participants, and event breakdowns.
    """
    # 1. Total events
    events_res = await db.execute(select(Event))
    events = events_res.scalars().all()
    total_events = len(events)

    # 2. Total registrations count
    total_regs_res = await db.execute(select(func.count(Registration.id)))
    total_registrations = total_regs_res.scalar() or 0

    # 3. Confirmed paid registrations
    confirmed_regs_res = await db.execute(
        select(func.count(Registration.id)).where(
            Registration.payment_status == PaymentStatus.SUCCESS.value
        )
    )
    total_confirmed = confirmed_regs_res.scalar() or 0

    # 4. Total revenue & online vs offline breakdown
    rev_res = await db.execute(
        select(func.sum(Registration.total_amount)).where(
            Registration.payment_status == PaymentStatus.SUCCESS.value
        )
    )
    total_revenue = rev_res.scalar() or Decimal("0.00")

    on_rev_res = await db.execute(
        select(func.sum(Registration.total_amount)).where(
            Registration.payment_status == PaymentStatus.SUCCESS.value,
            Registration.payment_mode == "ONLINE",
        )
    )
    online_revenue = on_rev_res.scalar() or Decimal("0.00")

    off_rev_res = await db.execute(
        select(func.sum(Registration.total_amount)).where(
            Registration.payment_status == PaymentStatus.SUCCESS.value,
            Registration.payment_mode == "OFFLINE",
        )
    )
    offline_revenue = off_rev_res.scalar() or Decimal("0.00")

    on_cnt_res = await db.execute(
        select(func.count(Registration.id)).where(
            Registration.payment_status == PaymentStatus.SUCCESS.value,
            Registration.payment_mode == "ONLINE",
        )
    )
    online_registrations_count = on_cnt_res.scalar() or 0

    off_cnt_res = await db.execute(
        select(func.count(Registration.id)).where(
            Registration.payment_status == PaymentStatus.SUCCESS.value,
            Registration.payment_mode == "OFFLINE",
        )
    )
    offline_registrations_count = off_cnt_res.scalar() or 0

    # 5. Total Checked in
    checked_in_res = await db.execute(
        select(func.count(Registration.id)).where(
            Registration.attendance_status == AttendanceStatus.PRESENT.value
        )
    )
    total_checked_in = checked_in_res.scalar() or 0

    # 6. Total team members count + primary participants
    team_members_res = await db.execute(
        select(func.count(TeamMember.id))
        .join(Registration, Registration.id == TeamMember.registration_id)
        .where(Registration.payment_status == PaymentStatus.SUCCESS.value)
    )
    team_members_count = team_members_res.scalar() or 0
    total_participants = total_confirmed + team_members_count

    # 7. Event-wise statistics breakdown
    event_stats_list = []
    for ev in events:
        # Total event registrations
        ev_all_regs_res = await db.execute(
            select(func.count(Registration.id)).where(Registration.event_id == ev.id)
        )
        ev_all_regs = ev_all_regs_res.scalar() or 0

        # Confirmed registrations
        ev_conf_res = await db.execute(
            select(func.count(Registration.id)).where(
                Registration.event_id == ev.id,
                Registration.payment_status == PaymentStatus.SUCCESS.value,
            )
        )
        ev_conf = ev_conf_res.scalar() or 0

        # Attended count
        ev_att_res = await db.execute(
            select(func.count(Registration.id)).where(
                Registration.event_id == ev.id,
                Registration.attendance_status == AttendanceStatus.PRESENT.value,
            )
        )
        ev_att = ev_att_res.scalar() or 0

        # Revenue
        ev_rev_res = await db.execute(
            select(func.sum(Registration.total_amount)).where(
                Registration.event_id == ev.id,
                Registration.payment_status == PaymentStatus.SUCCESS.value,
            )
        )
        ev_rev = ev_rev_res.scalar() or Decimal("0.00")

        # Online vs Offline revenue for this event
        ev_on_rev_res = await db.execute(
            select(func.sum(Registration.total_amount)).where(
                Registration.event_id == ev.id,
                Registration.payment_status == PaymentStatus.SUCCESS.value,
                Registration.payment_mode == "ONLINE",
            )
        )
        ev_on_rev = ev_on_rev_res.scalar() or Decimal("0.00")

        ev_off_rev_res = await db.execute(
            select(func.sum(Registration.total_amount)).where(
                Registration.event_id == ev.id,
                Registration.payment_status == PaymentStatus.SUCCESS.value,
                Registration.payment_mode == "OFFLINE",
            )
        )
        ev_off_rev = ev_off_rev_res.scalar() or Decimal("0.00")

        # Total individual participant count
        ev_tm_res = await db.execute(
            select(func.count(TeamMember.id))
            .join(Registration, Registration.id == TeamMember.registration_id)
            .where(
                Registration.event_id == ev.id,
                Registration.payment_status == PaymentStatus.SUCCESS.value,
            )
        )
        ev_tm_count = ev_tm_res.scalar() or 0
        ev_participants_count = ev_conf + ev_tm_count

        attendance_rate = (ev_att / ev_conf * 100.0) if ev_conf > 0 else 0.0

        event_stats_list.append(
            EventStatItem(
                event_id=str(ev.id),
                event_title=ev.title,
                event_type=ev.event_type,
                total_registrations=ev_all_regs,
                confirmed_paid_registrations=ev_conf,
                total_participants_count=ev_participants_count,
                total_attended_count=ev_att,
                attendance_rate=round(attendance_rate, 2),
                total_revenue=ev_rev,
                online_revenue=ev_on_rev,
                offline_revenue=ev_off_rev,
            )
        )

    return OverallStatsResponse(
        total_events=total_events,
        total_registrations=total_registrations,
        total_confirmed_registrations=total_confirmed,
        total_participants=total_participants,
        total_checked_in=total_checked_in,
        total_revenue=total_revenue,
        online_revenue=online_revenue,
        offline_revenue=offline_revenue,
        online_registrations_count=online_registrations_count,
        offline_registrations_count=offline_registrations_count,
        recent_registrations_count=total_confirmed,
        event_stats=event_stats_list,
    )


@router.get("/export/{event_id}")
async def export_event_registrations_csv(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Export all registrations & team members for an event as a CSV download."""
    event_res = await db.execute(select(Event).where(Event.id == event_id))
    event = event_res.scalars().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    regs_res = await db.execute(
        select(Registration)
        .where(Registration.event_id == event_id)
        .options(
            selectinload(Registration.team_members),
            selectinload(Registration.marked_by_volunteer),
        )
        .order_by(Registration.created_at.asc())
    )
    registrations = regs_res.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Write Header
    writer.writerow([
        "Registration Code",
        "Event Title",
        "Team Name",
        "Primary Name",
        "Primary Email",
        "Primary Phone",
        "College Name",
        "Department",
        "Year of Study",
        "Teammates",
        "Total Amount (INR)",
        "Payment Status",
        "Attendance Status",
        "Attended At",
        "Marked By Volunteer",
        "Registered At",
    ])

    for r in registrations:
        teammates_str = "; ".join(
            [f"{m.full_name} ({m.email}, {m.phone})" for m in r.team_members]
        ) if r.team_members else "N/A"

        writer.writerow([
            r.registration_code,
            event.title,
            r.team_name or "N/A",
            r.primary_name,
            r.primary_email,
            r.primary_phone,
            r.college_name,
            r.department,
            r.year_of_study,
            teammates_str,
            str(r.total_amount),
            r.payment_status,
            r.attendance_status,
            r.attended_at.isoformat() if r.attended_at else "N/A",
            r.marked_by_volunteer.full_name if r.marked_by_volunteer else "N/A",
            r.created_at.isoformat() if r.created_at else "",
        ])

    csv_content = output.getvalue()
    filename = f"{event.slug}_registrations.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
