import React, { useState } from 'react';
import { api } from '../services/api';
import DigitalTicketPass from './DigitalTicketPass';
import { useToast } from '../context/ToastContext';
import {
  Clock,
  MapPin,
  Users,
  CreditCard,
  Plus,
  Trash2,
  X,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  FileText,
  User,
} from 'lucide-react';

export default function EventModal({ event, onClose, onRegistered }) {
  if (!event) return null;

  const { success: toastSuccess, error: toastError } = useToast();

  const isTeam = event.event_type === 'TEAM';
  const fee = parseFloat(event.registration_fee || 0);
  const hasRules = Boolean(event.rules && event.rules.trim().length > 0);

  // Steps: 'rules' | 'form' | 'confirm' | 'ticket'
  const [step, setStep] = useState(hasRules ? 'rules' : 'form');
  const [ticketData, setTicketData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form State with separate course and semester
  const [formData, setFormData] = useState({
    primary_name: '',
    primary_email: '',
    primary_phone: '',
    college_name: '',
    department: '',
    course: '',
    semester: '',
    team_members: [], // [{ full_name, email, phone, college_name, department, course, semester, same_college, same_dept, same_course, same_sem }]
  });

  const handleAddTeammate = () => {
    const maxTeammates = (event.max_team_size || 1) - 1;
    if (formData.team_members.length >= maxTeammates) {
      alert(`Maximum team size for this event is ${event.max_team_size} members.`);
      return;
    }
    setFormData({
      ...formData,
      team_members: [
        ...formData.team_members,
        {
          full_name: '',
          email: '',
          phone: '',
          college_name: formData.college_name,
          department: formData.department,
          course: formData.course,
          semester: formData.semester,
          same_college: true,
          same_dept: true,
          same_course: true,
          same_sem: true,
        },
      ],
    });
  };

  const handleRemoveTeammate = (index) => {
    const updated = [...formData.team_members];
    updated.splice(index, 1);
    setFormData({ ...formData, team_members: updated });
  };

  const handleTeammateChange = (index, field, value) => {
    const updated = [...formData.team_members];
    updated[index][field] = value;
    setFormData({ ...formData, team_members: updated });
  };

  const handleToggleSame = (index, flagKey, targetField, primaryValue) => {
    const updated = [...formData.team_members];
    const newFlag = !updated[index][flagKey];
    updated[index][flagKey] = newFlag;
    if (newFlag) {
      updated[index][targetField] = primaryValue;
    }
    setFormData({ ...formData, team_members: updated });
  };

  // Validation before opening Confirmation Modal
  const handleProceedToConfirm = (e) => {
    e.preventDefault();
    setError(null);

    const phoneClean = formData.primary_phone.replace(/\D/g, '');
    if (phoneClean.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (isTeam) {
      const totalMembers = 1 + formData.team_members.length;
      if (totalMembers < (event.min_team_size || 1)) {
        setError(`This team event requires at least ${event.min_team_size} members.`);
        return;
      }
      for (let i = 0; i < formData.team_members.length; i++) {
        const tm = formData.team_members[i];
        if (!tm.full_name.trim() || !tm.email.trim() || !tm.phone.trim()) {
          setError(`Please fill in required contact details for Teammate #${i + 1}.`);
          return;
        }
      }
    }

    setStep('confirm');
  };

  // Submit to backend & verify payment
  const handleFinalSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const formattedTeammates = isTeam
        ? formData.team_members.map((m) => {
            const college = m.same_college ? formData.college_name : (m.college_name || formData.college_name);
            const dept = m.same_dept ? formData.department : (m.department || formData.department);
            const crs = m.same_course ? formData.course : (m.course || formData.course);
            const sem = m.same_sem ? formData.semester : (m.semester || formData.semester);

            return {
              full_name: m.full_name.trim(),
              email: m.email.trim(),
              phone: m.phone.trim(),
              college_name: college.trim(),
              department: dept.trim(),
              course_and_semester: `${crs.trim()}, ${sem.trim()}`.replace(/^,\s*|,\s*$/g, ''),
            };
          })
        : [];

      const primaryCourseSem = `${formData.course.trim()}, ${formData.semester.trim()}`.replace(/^,\s*|,\s*$/g, '');

      const payload = {
        event_id: event.id,
        primary_name: formData.primary_name.trim(),
        primary_email: formData.primary_email.trim(),
        primary_phone: formData.primary_phone.trim(),
        college_name: formData.college_name.trim(),
        department: formData.department.trim() || 'General',
        course_and_semester: primaryCourseSem,
        year_of_study: formData.semester.trim() || '1st Year',
        team_members: formattedTeammates,
        payment_mode: 'ONLINE',
      };

      const result = await api.createRegistration(payload);

      // Verify payment order if active
      if (result.payment_status === 'PENDING' && result.payment_session) {
        try {
          const verifyRes = await api.verifyPayment(result.payment_session.order_id);
          if (verifyRes.success) {
            result.payment_status = 'SUCCESS';
          }
        } catch (vErr) {
          console.log('Payment check:', vErr);
        }
      }

      // Fetch confirmed digital ticket pass
      const fullTicket = await api.getRegistrationByCode(result.registration_code);
      setTicketData(fullTicket);
      setStep('ticket');
      toastSuccess(`Registration Confirmed! Code: ${result.registration_code}`);
      if (onRegistered) onRegistered();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Registration failed. Please check inputs.');
      toastError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(3, 3, 5, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur-lg)',
          WebkitBackdropFilter: 'var(--glass-blur-lg)',
          borderRadius: '24px',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(212, 175, 55, 0.15)',
          maxWidth: step === 'ticket' ? '680px' : '650px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '2.25rem',
          position: 'relative',
        }}
      >
        {/* Requirement 7: In the confirmation modal, remove the close option in the top right */}
        {step !== 'confirm' && (
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              background: 'var(--bg-inset)',
              border: 'none',
              color: 'var(--text-muted)',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#EF4444';
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.background = 'var(--bg-inset)';
            }}
          >
            <X size={18} />
          </button>
        )}

        {/* ======================================================== */}
        {/* STEP 1: RULES POPUP (Shown if rules added by admin)     */}
        {/* ======================================================== */}
        {step === 'rules' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <ShieldCheck size={15} color="#D4AF37" />
              <span style={{ fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold-bright)' }}>
                Rules & Guidelines
              </span>
            </div>

            <h2 className="font-display gold-text-glow" style={{ fontSize: '1.85rem', fontWeight: '800', lineHeight: 1.2, marginBottom: '0.85rem' }}>
              {event.title}
            </h2>

            <div
              style={{
                display: 'flex',
                gap: '1.25rem',
                marginBottom: '1.5rem',
                padding: '0.85rem 1.15rem',
                borderRadius: '12px',
                background: 'var(--bg-inset)',
                border: '1px solid rgba(212, 175, 55, 0.15)',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Registration Fee</div>
                <div className="font-mono" style={{ fontSize: '1.05rem', fontWeight: '800', color: fee > 0 ? 'var(--gold-bright)' : '#34D399' }}>
                  {fee > 0 ? `₹${fee.toFixed(0)} / Event` : 'Free'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Type</div>
                <div style={{ fontSize: '0.92rem', fontWeight: '600', color: 'var(--text-white)' }}>
                  {isTeam ? `Group (${event.min_team_size}-${event.max_team_size} Members)` : 'Individual'}
                </div>
              </div>

              {event.venue && (
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Venue</div>
                  <div style={{ fontSize: '0.92rem', color: 'var(--text-offwhite)' }}>{event.venue}</div>
                </div>
              )}
            </div>

            <div
              style={{
                background: 'rgba(212, 175, 55, 0.05)',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                borderRadius: '14px',
                padding: '1.25rem 1.4rem',
                marginBottom: '1.75rem',
                maxHeight: '300px',
                overflowY: 'auto',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--gold-bright)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileText size={14} /> Please Read & Agree to Event Rules
              </div>
              <p style={{ color: 'var(--text-offwhite)', fontSize: '0.9rem', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
                {event.rules}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={onClose} className="glass-btn" style={{ padding: '0.75rem 1.4rem', fontSize: '0.85rem' }}>
                Cancel
              </button>
              <button onClick={() => setStep('form')} className="neu-btn-gold" style={{ padding: '0.85rem 1.85rem', fontSize: '0.88rem' }}>
                <span>I Agree & Proceed</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 2: REGISTRATION FORM                               */}
        {/* ======================================================== */}
        {step === 'form' && (
          <div>
            {hasRules && (
              <button
                onClick={() => setStep('rules')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--gold-bright)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.8rem',
                  marginBottom: '1rem',
                  padding: 0,
                }}
              >
                <ArrowLeft size={15} /> Back to Rules
              </button>
            )}

            {/* Requirement 4: Removed "Participant Registration" text */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h2 className="font-display gold-text-glow" style={{ fontSize: '1.75rem', fontWeight: '800' }}>
                {event.title}
              </h2>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Registration Fee: <strong style={{ color: fee > 0 ? 'var(--gold-bright)' : '#34D399' }}>{fee > 0 ? `₹${fee.toFixed(0)} (Per Event)` : 'Free'}</strong>
                {isTeam && ` • Team size: ${event.min_team_size}-${event.max_team_size} members`}
              </div>
            </div>

            {error && (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#F87171',
                  fontSize: '0.85rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleProceedToConfirm} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* Primary Participant Section */}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-white)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <User size={15} color="#D4AF37" />
                  <span>{isTeam ? 'Participant #1 (Team Lead)' : 'Participant Details'}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem', marginBottom: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.73rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={formData.primary_name}
                      onChange={(e) => setFormData({ ...formData, primary_name: e.target.value })}
                      className="neu-input"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.73rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={formData.primary_email}
                      onChange={(e) => setFormData({ ...formData, primary_email: e.target.value })}
                      className="neu-input"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem', marginBottom: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.73rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={formData.primary_phone}
                      onChange={(e) => setFormData({ ...formData, primary_phone: e.target.value })}
                      className="neu-input"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.73rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                      College / Institution *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Marian College"
                      value={formData.college_name}
                      onChange={(e) => setFormData({ ...formData, college_name: e.target.value })}
                      className="neu-input"
                      required
                    />
                  </div>
                </div>

                {/* Requirement 5: Department, Course and Semester as separate fields */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.73rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                      Department *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Science"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="neu-input"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.73rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                      Course *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. B.Tech"
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      className="neu-input"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.73rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                      Semester *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Semester 6"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      className="neu-input"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Requirement 6: Team events teammates (Team name removed!) */}
              {isTeam && (
                <div style={{ marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--gold-bright)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Users size={15} />
                        <span>Teammates ({1 + formData.team_members.length} / {event.max_team_size} members)</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        Min {event.min_team_size} required, Max {event.max_team_size}
                      </div>
                    </div>

                    {1 + formData.team_members.length < event.max_team_size && (
                      <button
                        type="button"
                        onClick={handleAddTeammate}
                        className="glass-btn"
                        style={{ fontSize: '0.75rem', padding: '0.45rem 0.85rem', color: 'var(--gold-bright)' }}
                      >
                        <Plus size={14} /> Add Teammate
                      </button>
                    )}
                  </div>

                  {formData.team_members.map((member, index) => (
                    <div
                      key={index}
                      style={{
                        background: 'var(--bg-inset)',
                        padding: '1.25rem',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        marginBottom: '1rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--gold-light)' }}>
                          Teammate #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTeammate(index)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#EF4444',
                            cursor: 'pointer',
                            padding: '3px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Remove teammate"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {/* Teammate Contact Fields */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.85rem' }}>
                        <input
                          type="text"
                          placeholder="Teammate Full Name *"
                          value={member.full_name}
                          onChange={(e) => handleTeammateChange(index, 'full_name', e.target.value)}
                          className="neu-input"
                          required
                        />
                        <input
                          type="email"
                          placeholder="Teammate Email *"
                          value={member.email}
                          onChange={(e) => handleTeammateChange(index, 'email', e.target.value)}
                          className="neu-input"
                          required
                        />
                        <input
                          type="tel"
                          placeholder="Teammate Phone *"
                          value={member.phone}
                          onChange={(e) => handleTeammateChange(index, 'phone', e.target.value)}
                          className="neu-input"
                          required
                        />
                      </div>

                      {/* Requirement 5: "Same as above" checkbox for College */}
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>College</span>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--gold-bright)', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={member.same_college}
                              onChange={() => handleToggleSame(index, 'same_college', 'college_name', formData.college_name)}
                              style={{ accentColor: 'var(--gold-bright)' }}
                            />
                            <span>Same as above</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          placeholder="Teammate College"
                          value={member.same_college ? formData.college_name : member.college_name}
                          onChange={(e) => handleTeammateChange(index, 'college_name', e.target.value)}
                          disabled={member.same_college}
                          className="neu-input"
                          style={{ opacity: member.same_college ? 0.75 : 1 }}
                          required
                        />
                      </div>

                      {/* Requirement 5: "Same as above" checkbox for Department, Course & Semester */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                        {/* Department */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Department</span>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--gold-bright)', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={member.same_dept}
                                onChange={() => handleToggleSame(index, 'same_dept', 'department', formData.department)}
                                style={{ accentColor: 'var(--gold-bright)' }}
                              />
                              <span>Same as above</span>
                            </label>
                          </div>
                          <input
                            type="text"
                            placeholder="Department"
                            value={member.same_dept ? formData.department : member.department}
                            onChange={(e) => handleTeammateChange(index, 'department', e.target.value)}
                            disabled={member.same_dept}
                            className="neu-input"
                            style={{ opacity: member.same_dept ? 0.75 : 1 }}
                            required
                          />
                        </div>

                        {/* Course */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Course</span>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--gold-bright)', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={member.same_course}
                                onChange={() => handleToggleSame(index, 'same_course', 'course', formData.course)}
                                style={{ accentColor: 'var(--gold-bright)' }}
                              />
                              <span>Same as above</span>
                            </label>
                          </div>
                          <input
                            type="text"
                            placeholder="Course"
                            value={member.same_course ? formData.course : member.course}
                            onChange={(e) => handleTeammateChange(index, 'course', e.target.value)}
                            disabled={member.same_course}
                            className="neu-input"
                            style={{ opacity: member.same_course ? 0.75 : 1 }}
                            required
                          />
                        </div>

                        {/* Semester */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Semester</span>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--gold-bright)', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={member.same_sem}
                                onChange={() => handleToggleSame(index, 'same_sem', 'semester', formData.semester)}
                                style={{ accentColor: 'var(--gold-bright)' }}
                              />
                              <span>Same as above</span>
                            </label>
                          </div>
                          <input
                            type="text"
                            placeholder="Semester"
                            value={member.same_sem ? formData.semester : member.semester}
                            onChange={(e) => handleTeammateChange(index, 'semester', e.target.value)}
                            disabled={member.same_sem}
                            className="neu-input"
                            style={{ opacity: member.same_sem ? 0.75 : 1 }}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Review & Proceed Button */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '1.25rem',
                  paddingTop: '1.25rem',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Registration Fee (Per Event)</div>
                  <div className="font-mono" style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--gold-bright)' }}>
                    {fee > 0 ? `₹${fee.toFixed(0)}` : 'Free Entry'}
                  </div>
                </div>

                <button
                  type="submit"
                  className="neu-btn-gold"
                  style={{ padding: '0.85rem 2rem', fontSize: '0.88rem' }}
                >
                  <span>Review & Confirm</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 3: CONFIRMATION MODAL                               */}
        {/* Requirement 7: No close X on top-right, only back arrow */}
        {/* Requirement 8: All teammate details shown                */}
        {/* ======================================================== */}
        {step === 'confirm' && (
          <div>
            {/* Requirement 7: Only back arrow in top left, no text */}
            <div style={{ marginBottom: '1rem' }}>
              <button
                onClick={() => setStep('form')}
                aria-label="Back to form"
                style={{
                  background: 'var(--bg-inset)',
                  border: '1px solid rgba(212, 175, 55, 0.25)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  color: 'var(--gold-bright)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--gold-bright)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.25)')}
              >
                <ArrowLeft size={18} />
              </button>
            </div>

            <h2 className="font-display gold-text-glow" style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.35rem' }}>
              Confirm Your Details
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Please do a quick check of what you entered before proceeding to payment.
            </p>

            {error && (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#F87171',
                  fontSize: '0.85rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Review Card */}
            <div
              style={{
                background: 'var(--bg-inset)',
                borderRadius: '18px',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.15rem',
              }}
            >
              {/* Event Title */}
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--gold-bright)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Event
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-white)' }}>
                  {event.title}
                </div>
              </div>

              {/* Primary Participant Full Details */}
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--gold-bright)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                  {isTeam ? 'Team Leader Details' : 'Participant Details'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Name</div>
                    <div style={{ fontSize: '0.92rem', fontWeight: '600', color: 'var(--text-white)' }}>{formData.primary_name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Email</div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-offwhite)' }}>{formData.primary_email}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Phone</div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-offwhite)' }}>{formData.primary_phone}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>College</div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-offwhite)' }}>{formData.college_name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Department</div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-offwhite)' }}>{formData.department}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Course & Semester</div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-offwhite)' }}>{formData.course}, {formData.semester}</div>
                  </div>
                </div>
              </div>

              {/* Requirement 8: All details of teammates shown */}
              {isTeam && formData.team_members.length > 0 && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.85rem' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--gold-bright)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.65rem' }}>
                    Teammates ({formData.team_members.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {formData.team_members.map((tm, idx) => {
                      const college = tm.same_college ? formData.college_name : tm.college_name;
                      const dept = tm.same_dept ? formData.department : tm.department;
                      const crs = tm.same_course ? formData.course : tm.course;
                      const sem = tm.same_sem ? formData.semester : tm.semester;

                      return (
                        <div
                          key={idx}
                          style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            padding: '0.85rem 1rem',
                            borderRadius: '12px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                            <span style={{ fontWeight: '700', color: 'var(--text-white)', fontSize: '0.9rem' }}>
                              #{idx + 2} {tm.full_name}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              📞 {tm.phone}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.4rem' }}>
                            <div>✉️ {tm.email}</div>
                            <div>🏫 {college}</div>
                            <div>🏢 {dept}</div>
                            <div>📚 {crs}, {sem}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Fee Summary */}
              <div
                style={{
                  borderTop: '1px solid rgba(212, 175, 55, 0.2)',
                  paddingTop: '0.85rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Registration Fee (Per Event)</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {fee > 0 ? 'Cashfree Gateway Payment' : 'Complimentary Free Access'}
                  </div>
                </div>
                <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--gold-bright)' }}>
                  {fee > 0 ? `₹${fee.toFixed(0)}` : 'FREE'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="neu-btn-gold"
                style={{ padding: '0.85rem 2.5rem', fontSize: '0.9rem' }}
              >
                {submitting ? (
                  <span>Processing Payment...</span>
                ) : (
                  <>
                    <CreditCard size={16} />
                    <span>{fee > 0 ? `Proceed to Pay ₹${fee.toFixed(0)}` : 'Confirm Free Entry'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 4: DIGITAL PASS (Success view)                     */}
        {/* ======================================================== */}
        {step === 'ticket' && ticketData && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid #10B981',
                  color: '#34D399',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem',
                }}
              >
                <CheckCircle2 size={28} />
              </div>
              <h2 className="font-display gold-text-glow" style={{ fontSize: '1.8rem', fontWeight: '800' }}>
                Registration Confirmed!
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                Your pass has been generated. Save or print this ticket for entry.
              </p>
            </div>

            <DigitalTicketPass registration={ticketData} onClose={onClose} />
          </div>
        )}
      </div>
    </div>
  );
}
