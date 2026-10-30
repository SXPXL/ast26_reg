import csv
from datetime import datetime
from decimal import Decimal
import io
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import openpyxl
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

from app.core.dependencies import require_admin, require_volunteer_or_admin
from app.db.session import get_db
from app.models.event import Event, EventVolunteer
from app.models.registration import AttendanceStatus, PaymentStatus, Registration
from app.models.team_member import TeamMember
from app.models.user import User, UserRole
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

    # 2. Total registrations count (Only confirmed paid registrations)
    total_regs_res = await db.execute(
        select(func.count(Registration.id)).where(
            Registration.payment_status == PaymentStatus.SUCCESS.value
        )
    )
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
        # Total event registrations (Confirmed paid only)
        ev_all_regs_res = await db.execute(
            select(func.count(Registration.id)).where(
                Registration.event_id == ev.id,
                Registration.payment_status == PaymentStatus.SUCCESS.value,
            )
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
        .where(
            Registration.event_id == event_id,
            Registration.payment_status == PaymentStatus.SUCCESS.value,
        )
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


@router.get("/export-xlsx")
async def export_registrations_xlsx(
    event_id: Optional[str] = None,
    payment_status: Optional[str] = None,
    attendance_status: Optional[str] = None,
    payment_mode: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_volunteer_or_admin),
):
    """
    Export registrations as a beautifully formatted Excel (.xlsx) file.
    Every teammate is listed as an individual participant row with their specific details.
    Volunteers can export for their assigned events; Admins can export all.
    """
    query = (
        select(Registration)
        .options(
            selectinload(Registration.event),
            selectinload(Registration.team_members),
            selectinload(Registration.marked_by_volunteer),
        )
    )

    # Scoping for volunteer role
    if current_user.role == UserRole.VOLUNTEER.value:
        assigned_events_res = await db.execute(
            select(EventVolunteer.event_id).where(EventVolunteer.user_id == current_user.id)
        )
        allowed_event_ids = assigned_events_res.scalars().all()
        if not allowed_event_ids:
            raise HTTPException(status_code=403, detail="No events assigned to this volunteer.")

        if event_id and event_id != "ALL":
            if event_id not in allowed_event_ids:
                raise HTTPException(status_code=403, detail="Not authorized to export this event.")
            query = query.where(Registration.event_id == event_id)
        else:
            query = query.where(Registration.event_id.in_(allowed_event_ids))

        # Volunteers only export confirmed registrations
        query = query.where(Registration.payment_status == PaymentStatus.SUCCESS.value)
    else:
        # Admin scoping
        if event_id and event_id != "ALL":
            query = query.where(Registration.event_id == event_id)
        if payment_status and payment_status.upper() != "ALL":
            query = query.where(Registration.payment_status == payment_status.upper())

    if attendance_status and attendance_status.upper() != "ALL":
        if attendance_status.upper() == "UNCHECKED_IN":
            query = query.where(Registration.attendance_status == AttendanceStatus.NOT_ATTENDED.value)
        else:
            query = query.where(Registration.attendance_status == attendance_status.upper())

    if payment_mode and payment_mode.upper() != "ALL":
        query = query.where(Registration.payment_mode == payment_mode.upper())

    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Registration.registration_code.ilike(search_term),
                Registration.primary_name.ilike(search_term),
                Registration.primary_email.ilike(search_term),
                Registration.primary_phone.ilike(search_term),
                Registration.college_name.ilike(search_term),
                Registration.team_name.ilike(search_term),
            )
        )

    query = query.order_by(Registration.created_at.desc())
    result = await db.execute(query)
    registrations = result.scalars().all()

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Participants"

    # Styling definitions
    header_fill = PatternFill(start_color="1A1A24", end_color="1A1A24", fill_type="solid")
    header_font = Font(name="Segoe UI", size=10, bold=True, color="D4AF37")

    lead_font = Font(name="Segoe UI", size=9, bold=True, color="111827")
    lead_fill = PatternFill(start_color="FFFDF2", end_color="FFFDF2", fill_type="solid")  # subtle gold tint

    member_font = Font(name="Segoe UI", size=9, color="374151")
    member_fill = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")

    thin_border = Border(
        left=Side(style="thin", color="E5E7EB"),
        right=Side(style="thin", color="E5E7EB"),
        top=Side(style="thin", color="E5E7EB"),
        bottom=Side(style="thin", color="E5E7EB"),
    )

    headers = [
        "Sl No",
        "Registration Code",
        "Event Title",
        "Team Name",
        "Participant Role",
        "Participant Name",
        "Email Address",
        "Phone Number",
        "College / Institution",
        "Department",
        "Semester / Year",
        "Payment Mode",
        "Total Reg Fee (INR)",
        "Payment Status",
        "Attendance Status",
        "Check-in Time",
        "Marked By Volunteer",
        "Registered At",
    ]
    ws.append(headers)

    for col_idx in range(1, len(headers) + 1):
        cell = ws.cell(row=1, column=col_idx)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

    ws.row_dimensions[1].height = 28

    sl_no = 1
    for reg in registrations:
        ev_title = reg.event.title if reg.event else "N/A"
        is_team = bool(reg.event and reg.event.event_type == "TEAM") or bool(reg.team_name or reg.team_members)
        primary_role = "Team Lead" if is_team else "Individual"

        attended_str = reg.attended_at.strftime("%Y-%m-%d %I:%M %p") if reg.attended_at else "-"
        marked_by = reg.marked_by_volunteer.full_name if reg.marked_by_volunteer else "-"
        registered_str = reg.created_at.strftime("%Y-%m-%d %I:%M %p") if reg.created_at else "-"

        # Row 1: Primary registrant / Team Lead
        row_lead = [
            sl_no,
            reg.registration_code,
            ev_title,
            reg.team_name or ("Solo" if not is_team else "-"),
            primary_role,
            reg.primary_name,
            reg.primary_email,
            reg.primary_phone,
            reg.college_name,
            reg.department or "-",
            reg.course_and_semester or reg.year_of_study or "-",
            reg.payment_mode or "ONLINE",
            float(reg.total_amount or 0),
            reg.payment_status,
            reg.attendance_status,
            attended_str,
            marked_by,
            registered_str,
        ]
        ws.append(row_lead)
        current_row_idx = ws.max_row
        for col_idx in range(1, len(headers) + 1):
            c = ws.cell(row=current_row_idx, column=col_idx)
            c.font = lead_font
            if is_team:
                c.fill = lead_fill
            c.border = thin_border
            if col_idx in [1, 2, 4, 5, 12, 14, 15]:
                c.alignment = Alignment(horizontal="center", vertical="center")
            elif col_idx == 13:
                c.alignment = Alignment(horizontal="right", vertical="center")
                c.number_format = "#,##0.00"

        sl_no += 1

        # Additional Rows: Each teammate as a separate participant
        if reg.team_members:
            for tm in reg.team_members:
                row_member = [
                    sl_no,
                    reg.registration_code,
                    ev_title,
                    reg.team_name or "-",
                    "Teammate",
                    tm.full_name,
                    tm.email or "-",
                    tm.phone or "-",
                    tm.college_name or reg.college_name,
                    tm.department or reg.department or "-",
                    tm.course_and_semester or "-",
                    reg.payment_mode or "ONLINE",
                    0.00,  # Team fee covered by registration
                    reg.payment_status,
                    reg.attendance_status,
                    attended_str,
                    marked_by,
                    registered_str,
                ]
                ws.append(row_member)
                current_row_idx = ws.max_row
                for col_idx in range(1, len(headers) + 1):
                    c = ws.cell(row=current_row_idx, column=col_idx)
                    c.font = member_font
                    c.fill = member_fill
                    c.border = thin_border
                    if col_idx in [1, 2, 4, 5, 12, 14, 15]:
                        c.alignment = Alignment(horizontal="center", vertical="center")
                    elif col_idx == 13:
                        c.alignment = Alignment(horizontal="right", vertical="center")
                        c.number_format = "#,##0.00"

                sl_no += 1

    # Auto-adjust column widths
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            val_str = str(cell.value or "")
            if len(val_str) > max_len:
                max_len = len(val_str)
        ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

    ws.freeze_panes = "A2"

    buf = io.BytesIO()
    wb.save(buf)
    xlsx_data = buf.getvalue()

    filename = f"Asthra26_Participants_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
    return Response(
        content=xlsx_data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/export-xlsx/{event_id}")
async def export_single_event_xlsx(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_volunteer_or_admin),
):
    """Convenience endpoint to export an individual event roster."""
    return await export_registrations_xlsx(
        event_id=event_id,
        payment_status="SUCCESS",
        db=db,
        current_user=current_user,
    )

