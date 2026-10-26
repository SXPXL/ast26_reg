import React, { useEffect, useState, useMemo, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import DigitalTicketPass from '../components/DigitalTicketPass';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckCircle,
  Clock,
  Users,
  Search,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  Download,
  AlertCircle,
  Eye,
  Lock,
  UserPlus,
  Filter,
  CreditCard,
  Banknote,
  QrCode,
  Sparkles,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Settings,
  Calendar,
  MapPin,
  Shield,
  FileSpreadsheet,
} from 'lucide-react';

export default function VolunteerPortal({ activeSection = 'status' }) {
  const { user, login } = useAuth();
  const toast = useToast();

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // Volunteer & Event data
  const [assignedEvents, setAssignedEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [inspectRegistration, setInspectRegistration] = useState(null);

  // Event Status Multi-Filters & Dropdown
  const [attendanceFilter, setAttendanceFilter] = useState('ALL'); // 'ALL' | 'CHECKED_IN' | 'UNCHECKED_IN'
  const [paymentFilter, setPaymentFilter] = useState('ALL'); // 'ALL' | 'OFFLINE' | 'ONLINE'
  const [eventDropdownOpen, setEventDropdownOpen] = useState(false);
  const eventDropdownRef = useRef(null);

  // Admin section states
  const [allEvents, setAllEvents] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [stats, setStats] = useState(null);

  // Admin Participant Filters
  const [participantFilterEvent, setParticipantFilterEvent] = useState('ALL');
  const [participantFilterAttendance, setParticipantFilterAttendance] = useState('ALL');
  const [participantFilterPaymentMode, setParticipantFilterPaymentMode] = useState('ALL');
  const [participantSearch, setParticipantSearch] = useState('');
  const [adminRegistrations, setAdminRegistrations] = useState([]);
  const [adminRegLoading, setAdminRegLoading] = useState(false);

  // Manual Spot Registration state
  const [manualEventId, setManualEventId] = useState('');
  const [manualDropdownOpen, setManualDropdownOpen] = useState(false);
  const manualDropdownRef = useRef(null);
  const [manualPaymentMode, setManualPaymentMode] = useState('OFFLINE'); // 'OFFLINE' | 'ONLINE'
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualSuccessTicket, setManualSuccessTicket] = useState(null);
  const [manualOnlineOrder, setManualOnlineOrder] = useState(null);
  const [manualForm, setManualForm] = useState({
    primary_name: '',
    primary_email: '',
    primary_phone: '',
    college_name: '',
    course_and_semester: '',
    team_name: '',
    team_members: [],
  });

  // Create / Edit Event Form state
  const [createEventModal, setCreateEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    slug: '',
    description: '',
    event_type: 'INDIVIDUAL',
    min_team_size: 1,
    max_team_size: 1,
    registration_fee: 0,
    max_capacity: 100,
    registration_deadline: '',
    event_date: '',
    start_time: '10:00 AM',
    end_time: '01:00 PM',
    venue: '',
    rules: '',
    is_active: true,
  });

  // Assign Volunteer Modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedEventForAssign, setSelectedEventForAssign] = useState(null);
  const [selectedVolunteerIds, setSelectedVolunteerIds] = useState([]);

  // Create Volunteer Form state
  const [newVolForm, setNewVolForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
  });

  // Settings State
  const [festSettings, setFestSettings] = useState(() => {
    const saved = localStorage.getItem('asthra_fest_settings');
    const defaultSettings = {
      fest_name: 'Asthra 26',
      venue_name: 'Main Campus & Tech Auditorium',
      contact_email: 'fest@asthra26.org',
      contact_phone: '+91 98765 43210',
      cash_desk_note: 'Please verify the currency notes and immediately hand over the stamped token pass.',
      hide_on_delete: true,
    };
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  const isAdmin = user && (user.role === 'ADMIN' || user.id === '00000000-0000-0000-0000-000000000001');

  useEffect(() => {
    if (user) {
      loadVolunteerData();
      if (isAdmin) {
        loadAdminData();
      }
    }
  }, [user]);

  useEffect(() => {
    if (selectedEventId) {
      fetchEventRegistrations(selectedEventId);
    }
  }, [selectedEventId]);

  // Close event and manual dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (eventDropdownRef.current && !eventDropdownRef.current.contains(e.target)) {
        setEventDropdownOpen(false);
      }
      if (manualDropdownRef.current && !manualDropdownRef.current.contains(e.target)) {
        setManualDropdownOpen(false);
      }
    };
    if (eventDropdownOpen || manualDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [eventDropdownOpen, manualDropdownOpen]);

  // Load all participants when admin enters 'participants' tab
  useEffect(() => {
    if (isAdmin && activeSection === 'participants') {
      fetchAdminRegistrations();
    }
  }, [activeSection, isAdmin, participantFilterEvent, participantFilterAttendance, participantFilterPaymentMode, participantSearch]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoginLoading(true);
      setLoginError(null);
      await login(username, password);
      toast.success('Signed in successfully!');
    } catch (err) {
      setLoginError(err.message || 'Login failed. Check username and password.');
      toast.error('Invalid credentials');
    } finally {
      setLoginLoading(false);
    }
  };

  const loadVolunteerData = async () => {
    try {
      setLoading(true);
      const events = await api.getMyEvents();
      setAssignedEvents(events || []);
      if (events && events.length > 0 && !selectedEventId) {
        setSelectedEventId(events[0].id);
        setManualEventId(events[0].id);
      }
    } catch (err) {
      console.error('Failed to load volunteer events:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      const [allEvs, vols, overviewStats] = await Promise.all([
        api.getEvents({ is_active: undefined }).catch(() => []),
        api.getVolunteers().catch(() => []),
        api.getOverviewStats().catch(() => null),
      ]);
      setAllEvents(allEvs || []);
      setVolunteers(vols || []);
      setStats(overviewStats);
      if (allEvs && allEvs.length > 0 && !manualEventId) {
        setManualEventId(allEvs[0].id);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  const fetchEventRegistrations = async (eventId) => {
    try {
      setLoading(true);
      const data = await api.getRegistrations({ event_id: eventId });
      setRegistrations(data || []);
    } catch (err) {
      console.error('Failed to load registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminRegistrations = async () => {
    try {
      setAdminRegLoading(true);
      const params = {};
      if (participantFilterEvent !== 'ALL') params.event_id = participantFilterEvent;
      if (participantFilterAttendance !== 'ALL') params.attendance_status = participantFilterAttendance;
      if (participantFilterPaymentMode !== 'ALL') params.payment_mode = participantFilterPaymentMode;
      if (participantSearch.trim()) params.search = participantSearch.trim();

      const data = await api.getRegistrations(params);
      setAdminRegistrations(data || []);
    } catch (err) {
      console.error('Failed to fetch admin registrations:', err);
    } finally {
      setAdminRegLoading(false);
    }
  };

  const handleToggleAttendance = async (reg) => {
    // The undo function is only available for the admin
    if (reg.attendance_status === 'PRESENT' && !isAdmin) {
      toast.info('Only an administrator can revert a confirmed check-in.');
      return;
    }

    const nextStatus = reg.attendance_status === 'PRESENT' ? 'NOT_ATTENDED' : 'PRESENT';
    const isMarkingPresent = nextStatus === 'PRESENT';

    try {
      setUpdatingId(reg.id);
      const updated = await api.updateAttendance(reg.id, nextStatus);

      // Update local state
      const updateList = (list) =>
        list.map((item) =>
          item.id === reg.id
            ? { ...item, attendance_status: updated.attendance_status, attended_at: updated.attended_at }
            : item
        );

      setRegistrations((prev) => updateList(prev));
      setAdminRegistrations((prev) => updateList(prev));

      if (isMarkingPresent) {
        toast.undo(`Checked in: ${reg.primary_name}`, async () => {
          await api.updateAttendance(reg.id, 'NOT_ATTENDED');
          setRegistrations((prev) =>
            prev.map((item) => (item.id === reg.id ? { ...item, attendance_status: 'NOT_ATTENDED' } : item))
          );
          setAdminRegistrations((prev) =>
            prev.map((item) => (item.id === reg.id ? { ...item, attendance_status: 'NOT_ATTENDED' } : item))
          );
          toast.info(`Reverted check-in for ${reg.primary_name}`);
        });
      } else {
        toast.info(`Marked ${reg.primary_name} as Not Checked In`);
      }
    } catch (err) {
      toast.error(`Attendance update error: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteParticipant = async (reg) => {
    const hideOnDelete = festSettings.hide_on_delete ?? true;

    if (hideOnDelete) {
      if (!confirm(`Hide participant "${reg.primary_name}"? Their record will be archived as Hidden and excluded from public rosters.`)) return;
      try {
        await api.updateAttendance(reg.id, 'HIDDEN');
        toast.success(`Participant "${reg.primary_name}" is now hidden.`);
        fetchAdminRegistrations();
        if (selectedEventId) fetchEventRegistrations(selectedEventId);
      } catch (err) {
        toast.error(`Failed to hide participant: ${err.message}`);
      }
    } else {
      if (!confirm(`Permanently DELETE participant "${reg.primary_name}"? This action CANNOT be undone.`)) return;
      try {
        await api.deleteRegistration(reg.id);
        toast.success(`Participant "${reg.primary_name}" permanently deleted.`);
        fetchAdminRegistrations();
        if (selectedEventId) fetchEventRegistrations(selectedEventId);
      } catch (err) {
        toast.error(`Failed to delete participant: ${err.message}`);
      }
    }
  };

  const handleRestoreParticipant = async (reg) => {
    try {
      await api.updateAttendance(reg.id, 'NOT_ATTENDED');
      toast.success(`Restored participant "${reg.primary_name}" to active roster.`);
      fetchAdminRegistrations();
      if (selectedEventId) fetchEventRegistrations(selectedEventId);
    } catch (err) {
      toast.error(`Failed to restore participant: ${err.message}`);
    }
  };

  // Event creation & editing
  const handleOpenCreateEvent = () => {
    setEditingEvent(null);
    setEventForm({
      title: '',
      slug: '',
      description: '',
      event_type: 'INDIVIDUAL',
      min_team_size: 1,
      max_team_size: 1,
      registration_fee: 0,
      max_capacity: 100,
      registration_deadline: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 16),
      event_date: new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 16),
      start_time: '10:00 AM',
      end_time: '01:00 PM',
      venue: '',
      rules: '',
      is_active: true,
    });
    setCreateEventModal(true);
  };

  const handleOpenEditEvent = (ev) => {
    setEditingEvent(ev);
    setEventForm({
      title: ev.title,
      slug: ev.slug,
      description: ev.description,
      event_type: ev.event_type,
      min_team_size: ev.min_team_size,
      max_team_size: ev.max_team_size,
      registration_fee: ev.registration_fee,
      max_capacity: ev.max_capacity || 100,
      registration_deadline: ev.registration_deadline ? new Date(ev.registration_deadline).toISOString().slice(0, 16) : '',
      event_date: ev.event_date ? new Date(ev.event_date).toISOString().slice(0, 16) : '',
      start_time: ev.start_time || '10:00 AM',
      end_time: ev.end_time || '01:00 PM',
      venue: ev.venue || '',
      rules: ev.rules || '',
      is_active: ev.is_active,
    });
    setCreateEventModal(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...eventForm,
        registration_fee: parseFloat(eventForm.registration_fee || 0),
        min_team_size: eventForm.event_type === 'INDIVIDUAL' ? 1 : parseInt(eventForm.min_team_size || 1),
        max_team_size: eventForm.event_type === 'INDIVIDUAL' ? 1 : parseInt(eventForm.max_team_size || 1),
        max_capacity: parseInt(eventForm.max_capacity) || null,
        registration_deadline: new Date(eventForm.registration_deadline).toISOString(),
        event_date: new Date(eventForm.event_date).toISOString(),
      };

      if (editingEvent) {
        await api.updateEvent(editingEvent.id, payload);
        toast.success(`Updated event: ${payload.title}`);
      } else {
        await api.createEvent(payload);
        toast.success(`Created event: ${payload.title}`);
      }

      setCreateEventModal(false);
      loadAdminData();
      loadVolunteerData();
    } catch (err) {
      toast.error(`Failed to save event: ${err.message}`);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to deactivate/delete this event?')) return;
    try {
      await api.deleteEvent(eventId);
      toast.success('Event deactivated');
      loadAdminData();
      loadVolunteerData();
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    }
  };

  // Volunteer accounts
  const handleCreateVolunteer = async (e) => {
    e.preventDefault();
    try {
      await api.createVolunteer(newVolForm);
      setNewVolForm({ full_name: '', email: '', phone: '', password: '' });
      toast.success('Volunteer account created successfully!');
      loadAdminData();
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    }
  };

  const handleOpenAssignModal = (ev) => {
    setSelectedEventForAssign(ev);
    const assignedIds = volunteers
      .filter((v) => v.assigned_event_ids && v.assigned_event_ids.includes(ev.id))
      .map((v) => v.id);
    setSelectedVolunteerIds(assignedIds);
    setAssignModalOpen(true);
  };

  const handleSaveVolunteerAssignment = async () => {
    if (!selectedEventForAssign) return;
    try {
      await api.assignVolunteers(selectedEventForAssign.id, selectedVolunteerIds);
      setAssignModalOpen(false);
      toast.success('Volunteers assigned successfully!');
      loadAdminData();
      loadVolunteerData();
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    }
  };

  // Manual Spot Registration Handlers
  const availableManualEvents = isAdmin ? allEvents : assignedEvents;
  const currentSelectedManualEvent = availableManualEvents.find((e) => e.id === manualEventId) || availableManualEvents[0];
  const manualFee = parseFloat(currentSelectedManualEvent?.registration_fee || 0);
  const isManualTeam = currentSelectedManualEvent?.event_type === 'TEAM';

  const handleManualAddTeammate = () => {
    const maxTeammates = (currentSelectedManualEvent?.max_team_size || 1) - 1;
    if (manualForm.team_members.length >= maxTeammates) {
      alert(`Max team size is ${currentSelectedManualEvent?.max_team_size}`);
      return;
    }
    setManualForm({
      ...manualForm,
      team_members: [
        ...manualForm.team_members,
        {
          full_name: '',
          email: '',
          phone: '',
          same_as_primary: true,
          college_name: manualForm.college_name,
          course_and_semester: manualForm.course_and_semester,
        },
      ],
    });
  };

  const handleManualRemoveTeammate = (index) => {
    const updated = [...manualForm.team_members];
    updated.splice(index, 1);
    setManualForm({ ...manualForm, team_members: updated });
  };

  const handleManualTeammateChange = (index, field, value) => {
    const updated = [...manualForm.team_members];
    updated[index][field] = value;
    setManualForm({ ...manualForm, team_members: updated });
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!currentSelectedManualEvent) {
      toast.error('Please select an event');
      return;
    }

    try {
      setManualSubmitting(true);

      const formattedTeammates = isManualTeam
        ? manualForm.team_members.map((m) => ({
          full_name: m.full_name.trim(),
          email: m.email.trim(),
          phone: m.phone.trim(),
          college_name: m.same_as_primary ? manualForm.college_name.trim() : (m.college_name || manualForm.college_name).trim(),
          course_and_semester: m.same_as_primary
            ? manualForm.course_and_semester.trim()
            : (m.course_and_semester || manualForm.course_and_semester).trim(),
        }))
        : [];

      const payload = {
        event_id: currentSelectedManualEvent.id,
        primary_name: manualForm.primary_name.trim(),
        primary_email: manualForm.primary_email.trim(),
        primary_phone: manualForm.primary_phone.trim(),
        college_name: manualForm.college_name.trim(),
        course_and_semester: manualForm.course_and_semester.trim(),
        department: manualForm.course_and_semester.trim() || 'General',
        year_of_study: '1st Year',
        team_name: isManualTeam ? manualForm.team_name.trim() : null,
        team_members: formattedTeammates,
        payment_mode: manualPaymentMode, // 'OFFLINE' or 'ONLINE'
      };

      const result = await api.createRegistration(payload);

      if (manualPaymentMode === 'OFFLINE') {
        // Instant success pass!
        const full = await api.getRegistrationByCode(result.registration_code);
        setManualSuccessTicket(full);
        toast.success(`Spot Registration Confirmed! Code: ${result.registration_code}`);
        fetchEventRegistrations(currentSelectedManualEvent.id);
        if (isAdmin) fetchAdminRegistrations();
      } else {
        // Online: Show QR Order
        setManualOnlineOrder(result);
        toast.info('Scan QR to complete online payment');
      }
    } catch (err) {
      toast.error(err.message || 'Manual registration failed');
    } finally {
      setManualSubmitting(false);
    }
  };

  const handleVerifyManualOnline = async () => {
    if (!manualOnlineOrder?.payment_session?.order_id) return;
    try {
      const verifyRes = await api.verifyPayment(manualOnlineOrder.payment_session.order_id);
      if (verifyRes.success) {
        const full = await api.getRegistrationByCode(manualOnlineOrder.registration_code);
        setManualOnlineOrder(null);
        setManualSuccessTicket(full);
        toast.success('Online Payment Verified & Confirmed!');
        fetchEventRegistrations(manualOnlineOrder.event_id);
        if (isAdmin) fetchAdminRegistrations();
      } else {
        toast.info('Payment still pending. Please verify after scanning QR.');
      }
    } catch (err) {
      toast.error('Payment verification failed');
    }
  };

  // Filter registrations in event status view based on selected filters and search query
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((r) => {
      // 1. Attendance filter
      if (attendanceFilter === 'CHECKED_IN' && r.attendance_status !== 'PRESENT') return false;
      if (attendanceFilter === 'UNCHECKED_IN' && r.attendance_status === 'PRESENT') return false;

      // 2. Payment mode filter
      if (paymentFilter === 'OFFLINE' && r.payment_mode !== 'OFFLINE') return false;
      if (paymentFilter === 'ONLINE' && r.payment_mode !== 'ONLINE') return false;

      // 3. Search query filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchName = r.primary_name?.toLowerCase().includes(term);
        const matchCode = r.registration_code?.toLowerCase().includes(term);
        const matchPhone = r.primary_phone?.includes(term);
        const matchCollege = r.college_name?.toLowerCase().includes(term);
        const matchTeam = r.team_name && r.team_name.toLowerCase().includes(term);
        const matchTeammates = r.team_members?.some((m) =>
          m.full_name?.toLowerCase().includes(term) || m.phone?.includes(term)
        );
        if (!matchName && !matchCode && !matchPhone && !matchCollege && !matchTeam && !matchTeammates) {
          return false;
        }
      }

      return true;
    });
  }, [registrations, attendanceFilter, paymentFilter, searchTerm]);

  const attendedCount = registrations.filter((r) => r.attendance_status === 'PRESENT').length;

  // 1. SIGN IN SCREEN IF NOT AUTHENTICATED
  if (!user) {
    return (
      <div style={{ maxWidth: '440px', margin: '5rem auto', padding: '0 1.5rem' }}>
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '24px',
            border: '1px solid rgba(212, 175, 55, 0.25)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 20px rgba(212, 175, 55, 0.1)',
            padding: '2.5rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #181824 0%, #0d0d14 100%)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <Lock size={22} color="#F5D77F" />
          </div>

          <h2 className="font-display gold-text-glow" style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.4rem' }}>
            Volunteer / Admin Portal
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.75rem' }}>
            Sign in to check-in attendees, spot-register participants, and manage events.
          </p>

          {loginError && (
            <div
              style={{
                padding: '0.75rem',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#F87171',
                fontSize: '0.82rem',
                marginBottom: '1.25rem',
              }}
            >
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ textAlign: 'left' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Username</label>
              <input
                type="text"
                placeholder="Username (e.g. admin)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="neu-input"
                required
              />
            </div>

            <div style={{ textAlign: 'left' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="neu-input"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="neu-btn-gold"
              style={{ marginTop: '0.5rem', width: '100%', padding: '0.85rem' }}
            >
              {loginLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Default Admin credentials: <strong>admin</strong> / <strong>1234</strong>
          </div>
        </div>
      </div>
    );
  }

  // 2. LOGGED IN PORTAL VIEWS
  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2.5rem 2rem 5rem 5.5rem' }}>
      {/* ======================================================== */}
      {/* 1. SECTION: VIEW EVENT STATUS (Attendance check-in)       */}
      {/* ======================================================== */}
      {activeSection === 'status' && (
        <div>
          <div style={{ marginBottom: '2rem' }}>
            <h1 className="font-display gold-text-glow" style={{ fontSize: '2.2rem', fontWeight: '800', lineHeight: 1.2 }}>
              Event Status & Check-In
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Select an event below to view registrations and check mark participants entering the event hall.
            </p>
          </div>

          {assignedEvents.length === 0 ? (
            <div
              style={{
                padding: '3rem',
                textAlign: 'center',
                background: 'var(--bg-card)',
                borderRadius: '20px',
                border: '1px solid rgba(212, 175, 55, 0.2)',
              }}
            >
              <AlertCircle size={32} color="#D4AF37" style={{ marginBottom: '0.75rem' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-white)' }}>
                No Events Assigned Yet
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Please ask the administrator to assign your volunteer account to an event.
              </p>
            </div>
          ) : (
            <div>
              {/* Turnout Summary Bar (Progress Div) */}
              <div
                style={{
                  display: 'flex',
                  gap: '2rem',
                  padding: '1.25rem 1.75rem',
                  borderRadius: '16px',
                  background: 'var(--bg-card)',
                  border: '1px solid rgba(212, 175, 55, 0.15)',
                  boxShadow: 'var(--neu-shadow-flat)',
                  marginBottom: '1.5rem',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Registered</div>
                  <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-white)' }}>
                    {registrations.length}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Entered Hall</div>
                  <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: '800', color: '#34D399' }}>
                    {attendedCount} / {registrations.length} ({registrations.length > 0 ? Math.round((attendedCount / registrations.length) * 100) : 0}%)
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending Check-In</div>
                  <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--gold-bright)' }}>
                    {registrations.length - attendedCount}
                  </div>
                </div>
              </div>

              {/* Event Dropdown & Multi-Filter Control Bar (under the progress div) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1.25rem',
                  padding: '1.1rem 1.4rem',
                  borderRadius: '16px',
                  background: 'var(--bg-card)',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  boxShadow: 'var(--neu-shadow-flat)',
                  marginBottom: '1.25rem',
                }}
              >
                {/* Event Dropdown Selector (Custom Styled Glass Dropdown) */}
                <div ref={eventDropdownRef} style={{ position: 'relative', minWidth: '260px', flex: '1 1 280px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      color: 'var(--gold-bright)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Select Event
                  </label>

                  {/* Trigger Button with full text visibility and rich gold styling */}
                  <button
                    type="button"
                    onClick={() => setEventDropdownOpen((prev) => !prev)}
                    style={{
                      width: '100%',
                      minHeight: '46px',
                      padding: '0.65rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      background: 'var(--bg-inset)',
                      border: eventDropdownOpen ? '1px solid var(--gold-bright)' : '1px solid rgba(212, 175, 55, 0.35)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      boxShadow: eventDropdownOpen ? '0 0 14px rgba(212, 175, 55, 0.25)' : 'var(--glass-shadow-inset)',
                      transition: 'all 0.2s ease',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', overflow: 'hidden', flex: 1 }}>
                      <Calendar size={16} color="#D4AF37" style={{ flexShrink: 0 }} />
                      <span
                        style={{
                          fontSize: '0.92rem',
                          fontWeight: '700',
                          color: 'var(--gold-bright)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {assignedEvents.find((e) => e.id === selectedEventId)?.title || 'Select Event'}
                      </span>
                      {assignedEvents.find((e) => e.id === selectedEventId)?.venue && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '6px',
                            flexShrink: 0,
                          }}
                        >
                          {assignedEvents.find((e) => e.id === selectedEventId)?.venue}
                        </span>
                      )}
                    </div>

                    <ChevronDown
                      size={16}
                      color="#D4AF37"
                      style={{
                        flexShrink: 0,
                        transform: eventDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </button>

                  {/* Dropdown Menu Options */}
                  {eventDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        left: 0,
                        right: 0,
                        maxHeight: '260px',
                        overflowY: 'auto',
                        background: 'rgba(15, 15, 24, 0.98)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(212, 175, 55, 0.35)',
                        borderRadius: '14px',
                        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.85), 0 0 15px rgba(212, 175, 55, 0.15)',
                        padding: '0.45rem',
                        zIndex: 100,
                        animation: 'fadeIn 0.15s ease-out',
                      }}
                    >
                      {assignedEvents.map((ev) => {
                        const isSelected = selectedEventId === ev.id;
                        return (
                          <div
                            key={ev.id}
                            onClick={() => {
                              setSelectedEventId(ev.id);
                              setEventDropdownOpen(false);
                            }}
                            style={{
                              padding: '0.65rem 0.85rem',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.75rem',
                              background: isSelected ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                              border: isSelected ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid transparent',
                              transition: 'all 0.15s ease',
                              marginBottom: '0.25rem',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.background = 'transparent';
                              }
                            }}
                          >
                            <div style={{ overflow: 'hidden' }}>
                              <div
                                style={{
                                  fontSize: '0.88rem',
                                  fontWeight: isSelected ? '700' : '600',
                                  color: isSelected ? 'var(--gold-bright)' : 'var(--text-white)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {ev.title}
                              </div>
                              {ev.venue && (
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                                  📍 {ev.venue}
                                </div>
                              )}
                            </div>

                            {isSelected && <CheckCircle size={15} color="#F5D77F" style={{ flexShrink: 0 }} />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Multi-Selection Filter Pills */}
                <div style={{ flex: '2 1 420px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Quick Status Filters
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {/* Checked in students */}
                    <button
                      type="button"
                      onClick={() => setAttendanceFilter((prev) => (prev === 'CHECKED_IN' ? 'ALL' : 'CHECKED_IN'))}
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        background: attendanceFilter === 'CHECKED_IN' ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-inset)',
                        border: attendanceFilter === 'CHECKED_IN' ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: attendanceFilter === 'CHECKED_IN' ? '#34D399' : 'var(--text-secondary)',
                      }}
                    >
                      ✓ Checked In
                    </button>

                    {/* Unchecked in students */}
                    <button
                      type="button"
                      onClick={() => setAttendanceFilter((prev) => (prev === 'UNCHECKED_IN' ? 'ALL' : 'UNCHECKED_IN'))}
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        background: attendanceFilter === 'UNCHECKED_IN' ? 'rgba(212, 175, 55, 0.2)' : 'var(--bg-inset)',
                        border: attendanceFilter === 'UNCHECKED_IN' ? '1px solid var(--gold-bright)' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: attendanceFilter === 'UNCHECKED_IN' ? 'var(--gold-bright)' : 'var(--text-secondary)',
                      }}
                    >
                      ⏳ Unchecked In
                    </button>

                    {/* Offline cash */}
                    <button
                      type="button"
                      onClick={() => setPaymentFilter((prev) => (prev === 'OFFLINE' ? 'ALL' : 'OFFLINE'))}
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        background: paymentFilter === 'OFFLINE' ? 'rgba(212, 175, 55, 0.2)' : 'var(--bg-inset)',
                        border: paymentFilter === 'OFFLINE' ? '1px solid var(--gold-bright)' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: paymentFilter === 'OFFLINE' ? 'var(--gold-bright)' : 'var(--text-secondary)',
                      }}
                    >
                      💵 Offline Cash
                    </button>

                    {/* Online */}
                    <button
                      type="button"
                      onClick={() => setPaymentFilter((prev) => (prev === 'ONLINE' ? 'ALL' : 'ONLINE'))}
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        background: paymentFilter === 'ONLINE' ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-inset)',
                        border: paymentFilter === 'ONLINE' ? '1px solid #60A5FA' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: paymentFilter === 'ONLINE' ? '#60A5FA' : 'var(--text-secondary)',
                      }}
                    >
                      💳 Online
                    </button>

                    {/* Reset Filters button when active */}
                    {(attendanceFilter !== 'ALL' || paymentFilter !== 'ALL') && (
                      <button
                        type="button"
                        onClick={() => {
                          setAttendanceFilter('ALL');
                          setPaymentFilter('ALL');
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          marginLeft: '0.35rem',
                        }}
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Search Bar (Works based on selected filters above) */}
              <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search filtered participants by name, code, phone, team, or college..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="neu-input"
                  style={{ paddingLeft: '2.8rem' }}
                />
              </div>

              {/* Attendees List */}
              {loading ? (
                <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--gold-bright)' }}>
                  Loading registrations...
                </div>
              ) : filteredRegistrations.length === 0 ? (
                <div
                  style={{
                    padding: '2.5rem',
                    textAlign: 'center',
                    background: 'var(--bg-card)',
                    borderRadius: '16px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  No participants registered yet or no match found for active filters.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {filteredRegistrations.map((reg) => {
                    const isPresent = reg.attendance_status === 'PRESENT';
                    return (
                      <div
                        key={reg.id}
                        style={{
                          background: 'var(--bg-card)',
                          borderRadius: '16px',
                          border: '1px solid rgba(212, 175, 55, 0.2)',
                          boxShadow: 'var(--neu-shadow-flat)',
                          padding: '1.25rem 1.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1.5rem',
                          borderLeft: isPresent ? '4px solid #10B981' : '4px solid rgba(212, 175, 55, 0.4)',
                          minHeight: '84px',
                        }}
                      >
                        {/* Participant info (left side) */}
                        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                            <span
                              className="font-mono"
                              style={{
                                fontSize: '0.9rem',
                                fontWeight: '700',
                                color: 'var(--gold-bright)',
                                background: 'var(--bg-inset)',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '6px',
                              }}
                            >
                              {reg.registration_code}
                            </span>
                            <span style={{ fontSize: '1.08rem', fontWeight: '700', color: 'var(--text-white)' }}>
                              {reg.primary_name}
                            </span>
                            {reg.team_name && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--gold-light)', background: 'rgba(212, 175, 55, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                                Team: {reg.team_name}
                              </span>
                            )}
                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '6px',
                                background: reg.payment_mode === 'OFFLINE' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                color: reg.payment_mode === 'OFFLINE' ? 'var(--gold-bright)' : '#60A5FA',
                                fontWeight: '700',
                              }}
                            >
                              {reg.payment_mode === 'OFFLINE' ? '💵 Cash / Offline' : '💳 Online'}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                            <span>📞 {reg.primary_phone}</span>
                            <span>🏫 {reg.college_name}</span>
                            {reg.course_and_semester && <span>📚 {reg.course_and_semester}</span>}
                          </div>
                        </div>

                        {/* Action Buttons: Fixed width container and fixed button sizes for perfect vertical alignment across cards */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            flexShrink: 0,
                            width: '240px',
                            justifyContent: 'flex-end',
                          }}
                        >
                          {/* Details Button */}
                          <button
                            onClick={async () => {
                              const full = await api.getRegistration(reg.id);
                              setInspectRegistration(full);
                            }}
                            className="neu-btn"
                            style={{
                              width: '95px',
                              height: '40px',
                              padding: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.35rem',
                              fontSize: '0.8rem',
                              flexShrink: 0,
                            }}
                          >
                            <Eye size={14} />
                            <span>Details</span>
                          </button>

                          {/* Check In / Entered Button:
                              - Text: 'Check In' when not checked in
                              - Text: 'Entered' when checked in
                              - Undo only available for admin
                              - No undo text written on button
                          */}
                          <button
                            onClick={() => handleToggleAttendance(reg)}
                            disabled={updatingId === reg.id || (isPresent && !isAdmin)}
                            className={isPresent ? 'neu-btn' : 'neu-btn-gold'}
                            title={isPresent && isAdmin ? 'Click to revert check-in' : undefined}
                            style={{
                              width: '125px',
                              height: '40px',
                              padding: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.4rem',
                              fontSize: '0.82rem',
                              fontWeight: '700',
                              flexShrink: 0,
                              background: isPresent ? 'rgba(16, 185, 129, 0.15)' : undefined,
                              borderColor: isPresent ? '#10B981' : undefined,
                              color: isPresent ? '#34D399' : undefined,
                              cursor: isPresent && !isAdmin ? 'default' : 'pointer',
                            }}
                          >
                            {updatingId === reg.id ? (
                              'Updating...'
                            ) : isPresent ? (
                              <>
                                <CheckCircle size={15} />
                                <span>Entered</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle size={15} />
                                <span>Check In</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. SECTION: MANUAL / SPOT REGISTRATION (Online & Offline) */}
      {/* ======================================================== */}
      {activeSection === 'manual_reg' && (
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 className="font-display gold-text-glow" style={{ fontSize: '2.2rem', fontWeight: '800', lineHeight: 1.2 }}>
              Manual Spot Registration
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Register attendees on the spot who have internet difficulties or prefer paying with physical cash.
            </p>
          </div>

          {availableManualEvents.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '16px' }}>
              No events available for registration.
            </div>
          ) : (
            <div style={{ background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid rgba(212, 175, 55, 0.25)', padding: '2rem', boxShadow: 'var(--neu-shadow-flat)' }}>
              <form onSubmit={handleManualSubmit}>
                {/* Horizontal 2-Column Form Layout: Minimizes vertical scrolling */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                    gap: '2.5rem',
                    alignItems: 'start',
                  }}
                >
                  {/* Left Column: Event Selector & Payment Mode */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Event Selector (Custom Styled Glass Dropdown) */}
                    <div ref={manualDropdownRef} style={{ position: 'relative' }}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          color: 'var(--gold-bright)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          marginBottom: '0.4rem',
                        }}
                      >
                        Select Event *
                      </label>

                      {/* Trigger Button with full text visibility and rich gold styling */}
                      <button
                        type="button"
                        onClick={() => setManualDropdownOpen((prev) => !prev)}
                        style={{
                          width: '100%',
                          minHeight: '46px',
                          padding: '0.65rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                          background: 'var(--bg-inset)',
                          border: manualDropdownOpen ? '1px solid var(--gold-bright)' : '1px solid rgba(212, 175, 55, 0.35)',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          boxShadow: manualDropdownOpen ? '0 0 14px rgba(212, 175, 55, 0.25)' : 'var(--glass-shadow-inset)',
                          transition: 'all 0.2s ease',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', overflow: 'hidden', flex: 1 }}>
                          <Calendar size={16} color="#D4AF37" style={{ flexShrink: 0 }} />
                          <span
                            style={{
                              fontSize: '0.92rem',
                              fontWeight: '700',
                              color: 'var(--gold-bright)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {currentSelectedManualEvent?.title || 'Select Event'}
                          </span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              color: manualFee > 0 ? 'var(--gold-bright)' : '#34D399',
                              fontWeight: '700',
                              background: manualFee > 0 ? 'rgba(212, 175, 55, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                              border: manualFee > 0 ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid rgba(16, 185, 129, 0.25)',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '6px',
                              flexShrink: 0,
                            }}
                          >
                            {manualFee > 0 ? `₹${manualFee.toFixed(0)}` : 'Free'}
                          </span>
                          {currentSelectedManualEvent?.venue && (
                            <span
                              style={{
                                fontSize: '0.72rem',
                                color: 'var(--text-muted)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '6px',
                                flexShrink: 0,
                              }}
                            >
                              {currentSelectedManualEvent.venue}
                            </span>
                          )}
                        </div>

                        <ChevronDown
                          size={16}
                          color="#D4AF37"
                          style={{
                            flexShrink: 0,
                            transform: manualDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                          }}
                        />
                      </button>

                      {/* Dropdown Menu Options */}
                      {manualDropdownOpen && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 6px)',
                            left: 0,
                            right: 0,
                            maxHeight: '260px',
                            overflowY: 'auto',
                            background: 'rgba(15, 15, 24, 0.98)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: '1px solid rgba(212, 175, 55, 0.35)',
                            borderRadius: '14px',
                            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.85), 0 0 15px rgba(212, 175, 55, 0.15)',
                            padding: '0.45rem',
                            zIndex: 100,
                            animation: 'fadeIn 0.15s ease-out',
                          }}
                        >
                          {availableManualEvents.map((ev) => {
                            const isSelected = (manualEventId || currentSelectedManualEvent?.id) === ev.id;
                            const evFee = parseFloat(ev.registration_fee || 0);
                            return (
                              <div
                                key={ev.id}
                                onClick={() => {
                                  setManualEventId(ev.id);
                                  setManualDropdownOpen(false);
                                }}
                                style={{
                                  padding: '0.65rem 0.85rem',
                                  borderRadius: '10px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '0.75rem',
                                  background: isSelected ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                                  border: isSelected ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid transparent',
                                  transition: 'all 0.15s ease',
                                  marginBottom: '0.25rem',
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.background = 'transparent';
                                  }
                                }}
                              >
                                <div style={{ overflow: 'hidden' }}>
                                  <div
                                    style={{
                                      fontSize: '0.88rem',
                                      fontWeight: isSelected ? '700' : '600',
                                      color: isSelected ? 'var(--gold-bright)' : 'var(--text-white)',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {ev.title}
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem', display: 'flex', gap: '0.5rem' }}>
                                    <span style={{ color: evFee > 0 ? 'var(--gold-bright)' : '#34D399', fontWeight: '600' }}>
                                      {evFee > 0 ? `₹${evFee.toFixed(0)}` : 'Free'}
                                    </span>
                                    <span>• {ev.event_type}</span>
                                    {ev.venue && <span>• 📍 {ev.venue}</span>}
                                  </div>
                                </div>

                                {isSelected && <CheckCircle size={15} color="#F5D77F" style={{ flexShrink: 0 }} />}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Payment Mode Selector: Offline Cash vs Online QR */}
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--gold-bright)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem', display: 'block' }}>
                        Payment Mode *
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                        <div
                          onClick={() => setManualPaymentMode('OFFLINE')}
                          style={{
                            padding: '0.85rem',
                            borderRadius: '12px',
                            background: manualPaymentMode === 'OFFLINE' ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-inset)',
                            border: manualPaymentMode === 'OFFLINE' ? '2px solid var(--gold-bright)' : '1px solid rgba(255,255,255,0.06)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <Banknote size={22} color={manualPaymentMode === 'OFFLINE' ? '#F5D77F' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-white)' }}>Cash / Desk</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Collect physical cash</div>
                          </div>
                        </div>

                        <div
                          onClick={() => setManualPaymentMode('ONLINE')}
                          style={{
                            padding: '0.85rem',
                            borderRadius: '12px',
                            background: manualPaymentMode === 'ONLINE' ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-inset)',
                            border: manualPaymentMode === 'ONLINE' ? '2px solid var(--gold-bright)' : '1px solid rgba(255,255,255,0.06)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <QrCode size={22} color={manualPaymentMode === 'ONLINE' ? '#F5D77F' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-white)' }}>Online Gateway</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Scan QR on phone</div>
                          </div>
                        </div>
                      </div>

                      {manualPaymentMode === 'OFFLINE' && manualFee > 0 && (
                        <div
                          style={{
                            marginTop: '0.75rem',
                            padding: '0.75rem 1rem',
                            borderRadius: '10px',
                            background: 'rgba(16, 185, 129, 0.12)',
                            border: '1px solid #10B981',
                            color: '#34D399',
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          <DollarSign size={16} />
                          <span>Collect ₹{manualFee.toFixed(0)} in cash at desk.</span>
                        </div>
                      )}

                      {manualPaymentMode === 'ONLINE' && manualFee > 0 && (
                        <div
                          style={{
                            marginTop: '0.75rem',
                            padding: '0.75rem 1rem',
                            borderRadius: '10px',
                            background: 'rgba(59, 130, 246, 0.12)',
                            border: '1px solid #3B82F6',
                            color: '#60A5FA',
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          <QrCode size={16} />
                          <span>Clicking submit will generate dynamic payment QR.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Participant Details & Teammates */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Primary details in compact 2-column grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>
                          Participant Name *
                        </label>
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={manualForm.primary_name}
                          onChange={(e) => setManualForm({ ...manualForm, primary_name: e.target.value })}
                          className="neu-input"
                          style={{ padding: '0.65rem 0.95rem', fontSize: '0.85rem' }}
                          required
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          placeholder="10-digit phone"
                          value={manualForm.primary_phone}
                          onChange={(e) => setManualForm({ ...manualForm, primary_phone: e.target.value })}
                          className="neu-input"
                          style={{ padding: '0.65rem 0.95rem', fontSize: '0.85rem' }}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>
                          Email Address *
                        </label>
                        <input
                          type="email"
                          placeholder="email@domain.com"
                          value={manualForm.primary_email}
                          onChange={(e) => setManualForm({ ...manualForm, primary_email: e.target.value })}
                          className="neu-input"
                          style={{ padding: '0.65rem 0.95rem', fontSize: '0.85rem' }}
                          required
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>
                          College / Institution *
                        </label>
                        <input
                          type="text"
                          placeholder="College Name"
                          value={manualForm.college_name}
                          onChange={(e) => setManualForm({ ...manualForm, college_name: e.target.value })}
                          className="neu-input"
                          style={{ padding: '0.65rem 0.95rem', fontSize: '0.85rem' }}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isManualTeam ? '1fr 1fr' : '1fr', gap: '0.85rem' }}>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>
                          Course and Semester *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. B.Tech CSE, Sem 6"
                          value={manualForm.course_and_semester}
                          onChange={(e) => setManualForm({ ...manualForm, course_and_semester: e.target.value })}
                          className="neu-input"
                          style={{ padding: '0.65rem 0.95rem', fontSize: '0.85rem' }}
                          required
                        />
                      </div>

                      {/* Team Name if group event */}
                      {isManualTeam && (
                        <div>
                          <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>
                            Team Name (Optional - auto numbered)
                          </label>
                          <input
                            type="text"
                            placeholder="Leave blank for auto team number"
                            value={manualForm.team_name}
                            onChange={(e) => setManualForm({ ...manualForm, team_name: e.target.value })}
                            className="neu-input"
                            style={{ padding: '0.65rem 0.95rem', fontSize: '0.85rem' }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Teammates if group event */}
                    {isManualTeam && (
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--gold-bright)' }}>
                            Teammates ({1 + manualForm.team_members.length} / {currentSelectedManualEvent?.max_team_size})
                          </span>
                          {1 + manualForm.team_members.length < (currentSelectedManualEvent?.max_team_size || 1) && (
                            <button type="button" onClick={handleManualAddTeammate} className="glass-btn" style={{ fontSize: '0.72rem', padding: '0.3rem 0.65rem' }}>
                              + Add Teammate
                            </button>
                          )}
                        </div>

                        {manualForm.team_members.map((tm, idx) => (
                          <div key={idx} style={{ background: 'var(--bg-inset)', padding: '0.65rem 0.85rem', borderRadius: '10px', marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Teammate #{idx + 1}</span>
                              <button type="button" onClick={() => handleManualRemoveTeammate(idx)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>
                                <Trash2 size={13} />
                              </button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.45rem' }}>
                              <input
                                type="text"
                                placeholder="Name"
                                value={tm.full_name}
                                onChange={(e) => handleManualTeammateChange(idx, 'full_name', e.target.value)}
                                className="neu-input"
                                style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                                required
                              />
                              <input
                                type="email"
                                placeholder="Email"
                                value={tm.email}
                                onChange={(e) => handleManualTeammateChange(idx, 'email', e.target.value)}
                                className="neu-input"
                                style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                                required
                              />
                              <input
                                type="tel"
                                placeholder="Phone"
                                value={tm.phone}
                                onChange={(e) => handleManualTeammateChange(idx, 'phone', e.target.value)}
                                className="neu-input"
                                style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                                required
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={manualSubmitting}
                      className="neu-btn-gold"
                      style={{ padding: '0.85rem', fontSize: '0.88rem', marginTop: '0.5rem' }}
                    >
                      {manualSubmitting
                        ? 'Processing Registration...'
                        : manualPaymentMode === 'OFFLINE'
                          ? `Confirm Spot Registration (Collect ₹${manualFee.toFixed(0)})`
                          : 'Generate Online Payment QR'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Online Payment QR Modal */}
          {manualOnlineOrder && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(3,3,5,0.85)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem',
              }}
            >
              <div
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '24px',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  maxWidth: '440px',
                  width: '100%',
                  padding: '2rem',
                  textAlign: 'center',
                }}
              >
                <h3 className="font-display gold-text" style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>
                  Scan QR to Pay
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Have the participant scan this code on their mobile device.
                </p>

                <div
                  style={{
                    background: '#FFFFFF',
                    padding: '1.25rem',
                    borderRadius: '16px',
                    display: 'inline-block',
                    marginBottom: '1.25rem',
                  }}
                >
                  <QRCodeSVG
                    value={
                      manualOnlineOrder?.payment_session?.payment_link ||
                      `https://sandbox.cashfree.com/pg/orders/${manualOnlineOrder?.payment_session?.order_id || ''}`
                    }
                    size={160}
                    level="H"
                  />
                </div>

                <div className="font-mono" style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--gold-bright)', marginBottom: '1rem' }}>
                  Amount: ₹{manualFee.toFixed(0)}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  <button onClick={() => setManualOnlineOrder(null)} className="neu-btn">
                    Cancel
                  </button>
                  <button onClick={handleVerifyManualOnline} className="neu-btn-gold">
                    Verify & Confirm Pass
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Ticket Pass View for Manual Registration */}
          {manualSuccessTicket && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(3,3,5,0.85)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem',
              }}
            >
              <div
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '24px',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  maxWidth: '680px',
                  width: '100%',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  padding: '2rem',
                }}
              >
                <DigitalTicketPass
                  registration={manualSuccessTicket}
                  onClose={() => setManualSuccessTicket(null)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. SECTION: VIEW ALL PARTICIPANTS (Admin Only)          */}
      {/* ======================================================== */}
      {activeSection === 'participants' && isAdmin && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 className="font-display gold-text-glow" style={{ fontSize: '2.2rem', fontWeight: '800' }}>
                Registered Participants
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Filter and inspect all fest participants across all events.
              </p>
            </div>

            {/* Quick stats counter */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-card)', padding: '0.65rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Filtered Count</div>
                <div className="font-mono" style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--gold-bright)' }}>
                  {adminRegistrations.length}
                </div>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div
            style={{
              background: 'var(--bg-card)',
              padding: '1.25rem 1.5rem',
              borderRadius: '18px',
              border: '1px solid rgba(212, 175, 55, 0.2)',
              marginBottom: '1.75rem',
              display: 'flex',
              gap: '1.1rem',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            {/* Event Filter */}
            <div style={{ flex: '1 1 210px' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--gold-bright)', display: 'block', marginBottom: '0.35rem', letterSpacing: '0.04em' }}>
                Event
              </label>
              <select
                value={participantFilterEvent}
                onChange={(e) => setParticipantFilterEvent(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  background: '#0d0d16',
                  border: '1px solid rgba(212, 175, 55, 0.35)',
                  borderRadius: '12px',
                  padding: '0.55rem 2.2rem 0.55rem 0.85rem',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  color: 'var(--text-white)',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23D4AF37' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '15px',
                  outline: 'none',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                  cursor: 'pointer',
                }}
              >
                <option value="ALL" style={{ background: '#0d0d16', color: '#f3f4f6' }}>All Events</option>
                {allEvents.map((e) => (
                  <option key={e.id} value={e.id} style={{ background: '#0d0d16', color: '#f3f4f6' }}>{e.title}</option>
                ))}
              </select>
            </div>

            {/* Attendance Status Filter */}
            <div style={{ flex: '1 1 180px' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--gold-bright)', display: 'block', marginBottom: '0.35rem', letterSpacing: '0.04em' }}>
                Check-In Status
              </label>
              <select
                value={participantFilterAttendance}
                onChange={(e) => setParticipantFilterAttendance(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  background: '#0d0d16',
                  border: '1px solid rgba(212, 175, 55, 0.35)',
                  borderRadius: '12px',
                  padding: '0.55rem 2.2rem 0.55rem 0.85rem',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  color: 'var(--text-white)',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23D4AF37' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '15px',
                  outline: 'none',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                  cursor: 'pointer',
                }}
              >
                <option value="ALL" style={{ background: '#0d0d16', color: '#f3f4f6' }}>All (Active Participants)</option>
                <option value="PRESENT" style={{ background: '#0d0d16', color: '#f3f4f6' }}>Checked In / Present</option>
                <option value="NOT_ATTENDED" style={{ background: '#0d0d16', color: '#f3f4f6' }}>Not Entered</option>
                <option value="HIDDEN" style={{ background: '#0d0d16', color: '#f3f4f6' }}>Hidden</option>
              </select>
            </div>

            {/* Payment Mode Filter */}
            <div style={{ flex: '1 1 180px' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--gold-bright)', display: 'block', marginBottom: '0.35rem', letterSpacing: '0.04em' }}>
                Payment Mode
              </label>
              <select
                value={participantFilterPaymentMode}
                onChange={(e) => setParticipantFilterPaymentMode(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  background: '#0d0d16',
                  border: '1px solid rgba(212, 175, 55, 0.35)',
                  borderRadius: '12px',
                  padding: '0.55rem 2.2rem 0.55rem 0.85rem',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  color: 'var(--text-white)',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23D4AF37' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '15px',
                  outline: 'none',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                  cursor: 'pointer',
                }}
              >
                <option value="ALL" style={{ background: '#0d0d16', color: '#f3f4f6' }}>All Payment Modes</option>
                <option value="OFFLINE" style={{ background: '#0d0d16', color: '#f3f4f6' }}>Offline Cash</option>
                <option value="ONLINE" style={{ background: '#0d0d16', color: '#f3f4f6' }}>Online Gateway</option>
              </select>
            </div>

            {/* Search Input */}
            <div style={{ flex: '2 1 240px' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--gold-bright)', display: 'block', marginBottom: '0.35rem', letterSpacing: '0.04em' }}>
                Search
              </label>
              <input
                type="text"
                placeholder="Search name, code, phone, team..."
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  background: '#0d0d16',
                  border: '1px solid rgba(212, 175, 55, 0.35)',
                  borderRadius: '12px',
                  padding: '0.55rem 0.85rem',
                  fontSize: '0.82rem',
                  fontWeight: '500',
                  color: 'var(--text-white)',
                  outline: 'none',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                }}
              />
            </div>
          </div>

          {/* Participants Table */}
          {adminRegLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gold-bright)' }}>Loading participants...</div>
          ) : adminRegistrations.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '16px', color: 'var(--text-secondary)' }}>
              No participants match the selected filter criteria.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {adminRegistrations.map((reg) => {
                const isPresent = reg.attendance_status === 'PRESENT';
                const isHidden = reg.attendance_status === 'HIDDEN';
                return (
                  <div
                    key={reg.id}
                    style={{
                      background: 'var(--bg-card)',
                      borderRadius: '16px',
                      border: '1px solid rgba(212, 175, 55, 0.2)',
                      padding: '1.15rem 1.4rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      borderLeft: isHidden
                        ? '4px solid #6B7280'
                        : isPresent
                        ? '4px solid #10B981'
                        : '4px solid rgba(212, 175, 55, 0.4)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                        <span className="font-mono" style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--gold-bright)', background: 'var(--bg-inset)', padding: '0.2rem 0.45rem', borderRadius: '6px' }}>
                          {reg.registration_code}
                        </span>
                        <span style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-white)' }}>
                          {reg.primary_name}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          • {reg.event_title}
                        </span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '6px',
                            background: reg.payment_mode === 'OFFLINE' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                            color: reg.payment_mode === 'OFFLINE' ? 'var(--gold-bright)' : '#60A5FA',
                            fontWeight: '700',
                          }}
                        >
                          {reg.payment_mode === 'OFFLINE' ? 'Cash' : 'Online'}
                        </span>
                        {isHidden && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '6px',
                              background: 'rgba(107, 114, 128, 0.25)',
                              color: '#9CA3AF',
                              fontWeight: '700',
                              border: '1px solid rgba(156, 163, 175, 0.3)',
                            }}
                          >
                            Hidden
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                        <span>📞 {reg.primary_phone}</span>
                        <span>✉️ {reg.primary_email}</span>
                        <span>🏫 {reg.college_name}</span>
                        {reg.course_and_semester && <span>📚 {reg.course_and_semester}</span>}
                        {reg.team_name && <span style={{ color: 'var(--gold-light)' }}>Team: {reg.team_name}</span>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <button
                        onClick={async () => {
                          const full = await api.getRegistration(reg.id);
                          setInspectRegistration(full);
                        }}
                        className="neu-btn"
                        style={{ fontSize: '0.78rem', padding: '0.5rem 0.85rem' }}
                      >
                        <Eye size={14} /> Details
                      </button>

                      {isHidden ? (
                        <>
                          <button
                            onClick={() => handleRestoreParticipant(reg)}
                            className="neu-btn"
                            style={{
                              fontSize: '0.78rem',
                              padding: '0.5rem 0.85rem',
                              borderColor: 'rgba(16, 185, 129, 0.4)',
                              color: '#34D399',
                              background: 'rgba(16, 185, 129, 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                            title="Restore participant to active roster"
                          >
                            <RotateCcw size={14} /> Restore
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm(`Permanently delete participant "${reg.primary_name}" from database? This action cannot be undone.`)) return;
                              try {
                                await api.deleteRegistration(reg.id);
                                toast.success(`Participant "${reg.primary_name}" permanently deleted.`);
                                fetchAdminRegistrations();
                              } catch (err) {
                                toast.error(`Failed to delete participant: ${err.message}`);
                              }
                            }}
                            className="neu-btn"
                            style={{
                              fontSize: '0.78rem',
                              padding: '0.5rem 0.85rem',
                              borderColor: 'rgba(239, 68, 68, 0.4)',
                              color: '#F87171',
                              background: 'rgba(239, 68, 68, 0.12)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                            title="Permanently remove from database"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleDeleteParticipant(reg)}
                          className="neu-btn"
                          style={{
                            fontSize: '0.78rem',
                            padding: '0.5rem 0.95rem',
                            borderColor: 'rgba(239, 68, 68, 0.4)',
                            color: '#F87171',
                            background: 'rgba(239, 68, 68, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            cursor: 'pointer',
                          }}
                          title={festSettings.hide_on_delete ? 'Hide participant from roster' : 'Permanently delete participant'}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. SECTION: CREATE & MANAGE EVENTS (Admin Only)          */}
      {/* ======================================================== */}
      {activeSection === 'events' && isAdmin && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>

              <h1 className="font-display gold-text-glow" style={{ fontSize: '2.2rem', fontWeight: '800' }}>
                Create & Manage Events
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Define event schedules, start and end times, registration fees, and rules.
              </p>
            </div>

            <button onClick={handleOpenCreateEvent} className="neu-btn-gold" style={{ padding: '0.8rem 1.6rem' }}>
              <Plus size={16} /> Create Event
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {allEvents.map((ev) => (
              <div
                key={ev.id}
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '20px',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--neu-shadow-flat)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3 className="font-display gold-text" style={{ fontSize: '1.3rem', fontWeight: '700' }}>
                      {ev.title}
                    </h3>
                    <span className="font-mono" style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--gold-bright)' }}>
                      ₹{parseFloat(ev.registration_fee || 0).toFixed(0)}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                    {ev.description}
                  </p>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.25rem' }}>
                    <div>📍 {ev.venue || 'Main Venue'}</div>
                    <div>🕒 {ev.start_time || '10:00 AM'} - {ev.end_time || '01:00 PM'}</div>
                    <div>👥 {ev.event_type} {ev.event_type === 'TEAM' && `(${ev.min_team_size}-${ev.max_team_size} members)`}</div>
                    {ev.rules && (
                      <div style={{ color: 'var(--gold-light)', fontStyle: 'italic' }}>
                        📜 Rules added ({ev.rules.length} chars)
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem', flexWrap: 'wrap' }}>
                  <button onClick={() => handleOpenAssignModal(ev)} className="neu-btn" style={{ fontSize: '0.75rem', padding: '0.45rem 0.85rem' }}>
                    Assign Volunteers
                  </button>
                  <button onClick={() => handleOpenEditEvent(ev)} className="neu-btn" style={{ fontSize: '0.75rem', padding: '0.45rem 0.85rem' }}>
                    <Edit2 size={13} /> Edit
                  </button>
                  <button onClick={() => handleDeleteEvent(ev.id)} className="neu-btn" style={{ fontSize: '0.75rem', padding: '0.45rem 0.85rem', color: '#EF4444' }}>
                    <Trash2 size={13} /> Deactivate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. SECTION: ANALYTICS & REVENUE (Admin Only)             */}
      {/* ======================================================== */}
      {activeSection === 'stats' && isAdmin && (
        <div>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--gold-bright)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Financial & Operations Report
            </div>
            <h1 className="font-display gold-text-glow" style={{ fontSize: '2.2rem', fontWeight: '800' }}>
              Analytics & Overview
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Real-time revenue metrics, offline cash vs online payments, and event turnout rates.
            </p>
          </div>

          {/* Top Metrics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '18px', border: '1px solid rgba(212, 175, 55, 0.25)', boxShadow: 'var(--neu-shadow-flat)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Revenue</div>
              <div className="font-mono" style={{ fontSize: '1.9rem', fontWeight: '800', color: 'var(--gold-bright)', marginTop: '0.25rem' }}>
                ₹{stats ? parseFloat(stats.total_revenue || 0).toFixed(0) : '0'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>All confirmed registrations</div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '18px', border: '1px solid rgba(16, 185, 129, 0.25)', boxShadow: 'var(--neu-shadow-flat)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Offline Cash Collected</div>
              <div className="font-mono" style={{ fontSize: '1.9rem', fontWeight: '800', color: '#34D399', marginTop: '0.25rem' }}>
                ₹{stats ? parseFloat(stats.offline_revenue || 0).toFixed(0) : '0'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {stats?.offline_registrations_count || 0} cash registrations
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '18px', border: '1px solid rgba(59, 130, 246, 0.25)', boxShadow: 'var(--neu-shadow-flat)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Online PG Revenue</div>
              <div className="font-mono" style={{ fontSize: '1.9rem', fontWeight: '800', color: '#60A5FA', marginTop: '0.25rem' }}>
                ₹{stats ? parseFloat(stats.online_revenue || 0).toFixed(0) : '0'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {stats?.online_registrations_count || 0} online registrations
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '18px', border: '1px solid rgba(212, 175, 55, 0.25)', boxShadow: 'var(--neu-shadow-flat)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Turnout / Checked In</div>
              <div className="font-mono" style={{ fontSize: '1.9rem', fontWeight: '800', color: 'var(--text-white)', marginTop: '0.25rem' }}>
                {stats?.total_checked_in || 0} / {stats?.total_confirmed_registrations || 0}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--gold-bright)', marginTop: '0.25rem' }}>
                {stats?.overall_attendance_rate ? `${stats.overall_attendance_rate}% Hall Attendance` : '0%'}
              </div>
            </div>
          </div>

          {/* Per-Event Breakdown Table */}
          <div style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid rgba(212, 175, 55, 0.2)', padding: '1.75rem', boxShadow: 'var(--neu-shadow-flat)' }}>
            <h3 className="font-display gold-text" style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '1.25rem' }}>
              Performance Per Event
            </h3>

            {stats?.events_breakdown?.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)' }}>No event data recorded yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {stats?.events_breakdown?.map((ev) => (
                  <div
                    key={ev.event_id}
                    style={{
                      background: 'var(--bg-inset)',
                      padding: '1rem 1.25rem',
                      borderRadius: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-white)' }}>
                        {ev.event_title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        Fee: ₹{parseFloat(ev.registration_fee || 0).toFixed(0)} • Turnout: {ev.checked_in_count} / {ev.total_registrations} ({ev.attendance_percentage}%)
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Revenue</div>
                        <div className="font-mono" style={{ fontWeight: '800', color: 'var(--gold-bright)' }}>
                          ₹{parseFloat(ev.total_revenue || 0).toFixed(0)}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Offline Cash</div>
                        <div className="font-mono" style={{ fontWeight: '700', color: '#34D399' }}>
                          ₹{parseFloat(ev.offline_revenue || 0).toFixed(0)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. SECTION: VOLUNTEER ACCOUNTS (Admin Only)              */}
      {/* ======================================================== */}
      {activeSection === 'volunteers' && isAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* Create Volunteer */}
          <div style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid rgba(212, 175, 55, 0.2)', padding: '2rem' }}>
            <h2 className="font-display gold-text-glow" style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '1rem' }}>
              Create Volunteer Account
            </h2>

            <form onSubmit={handleCreateVolunteer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Full Name *</label>
                <input
                  type="text"
                  placeholder="Volunteer Name"
                  value={newVolForm.full_name}
                  onChange={(e) => setNewVolForm({ ...newVolForm, full_name: e.target.value })}
                  className="neu-input"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Email Address *</label>
                <input
                  type="email"
                  placeholder="volunteer@fest.com"
                  value={newVolForm.email}
                  onChange={(e) => setNewVolForm({ ...newVolForm, email: e.target.value })}
                  className="neu-input"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Phone Number</label>
                <input
                  type="tel"
                  placeholder="Phone"
                  value={newVolForm.phone}
                  onChange={(e) => setNewVolForm({ ...newVolForm, phone: e.target.value })}
                  className="neu-input"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Password *</label>
                <input
                  type="password"
                  placeholder="Password"
                  value={newVolForm.password}
                  onChange={(e) => setNewVolForm({ ...newVolForm, password: e.target.value })}
                  className="neu-input"
                  required
                />
              </div>

              <button type="submit" className="neu-btn-gold" style={{ marginTop: '0.5rem' }}>
                Register Volunteer
              </button>
            </form>
          </div>

          {/* Volunteer Roster */}
          <div style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid rgba(212, 175, 55, 0.2)', padding: '2rem' }}>
            <h2 className="font-display gold-text-glow" style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '1rem' }}>
              Volunteers Roster ({volunteers.length})
            </h2>

            {volunteers.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)' }}>No volunteers registered yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {volunteers.map((v) => (
                  <div
                    key={v.id}
                    style={{
                      background: 'var(--bg-inset)',
                      padding: '1rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-white)' }}>
                      {v.full_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {v.email} {v.phone && `• ${v.phone}`}
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                      Assigned:{' '}
                      {v.assigned_events && v.assigned_events.length > 0 ? (
                        v.assigned_events.join(', ')
                      ) : (
                        <span style={{ fontStyle: 'italic' }}>None yet</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. SECTION: SETTINGS (Admin Only)                        */}
      {/* ======================================================== */}
      {activeSection === 'settings' && isAdmin && (
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--gold-bright)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Fest Configuration
            </div>
            <h1 className="font-display gold-text-glow" style={{ fontSize: '2.2rem', fontWeight: '800' }}>
              System Settings
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Configure public fest attributes, contact helpline numbers, and desk procedures.
            </p>
          </div>

          <div style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid rgba(212, 175, 55, 0.25)', padding: '2rem', boxShadow: 'var(--neu-shadow-flat)' }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                localStorage.setItem('asthra_fest_settings', JSON.stringify(festSettings));
                toast.success('Fest settings saved successfully!');
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Fest Name</label>
                <input
                  type="text"
                  value={festSettings.fest_name}
                  onChange={(e) => setFestSettings({ ...festSettings, fest_name: e.target.value })}
                  className="neu-input"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Venue / Campus Location</label>
                <input
                  type="text"
                  value={festSettings.venue_name}
                  onChange={(e) => setFestSettings({ ...festSettings, venue_name: e.target.value })}
                  className="neu-input"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Helpdesk Email</label>
                  <input
                    type="email"
                    value={festSettings.contact_email}
                    onChange={(e) => setFestSettings({ ...festSettings, contact_email: e.target.value })}
                    className="neu-input"
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Helpdesk Phone</label>
                  <input
                    type="tel"
                    value={festSettings.contact_phone}
                    onChange={(e) => setFestSettings({ ...festSettings, contact_phone: e.target.value })}
                    className="neu-input"
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Offline Cash Desk Instructions</label>
                <textarea
                  value={festSettings.cash_desk_note}
                  onChange={(e) => setFestSettings({ ...festSettings, cash_desk_note: e.target.value })}
                  className="neu-input"
                  rows={3}
                />
              </div>

              {/* Setting: Hide participants on delete */}
              <div
                style={{
                  background: 'var(--bg-inset)',
                  padding: '1.15rem 1.35rem',
                  borderRadius: '14px',
                  border: '1px solid rgba(212, 175, 55, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s ease',
                }}
                onClick={() => setFestSettings((prev) => ({ ...prev, hide_on_delete: !prev.hide_on_delete }))}
              >
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--text-white)' }}>
                    Hide participants on delete
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: '1.4' }}>
                    When enabled, clicking Delete marks participants as <strong>Hidden</strong> rather than deleting them from the database. When disabled, Delete permanently purges the record.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={festSettings.hide_on_delete ?? true}
                  onChange={(e) => setFestSettings((prev) => ({ ...prev, hide_on_delete: e.target.checked }))}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    accentColor: 'var(--gold-bright)',
                    flexShrink: 0,
                  }}
                />
              </div>

              <button type="submit" className="neu-btn-gold" style={{ marginTop: '0.5rem', padding: '0.85rem' }}>
                Save Settings
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE / EDIT EVENT                               */}
      {/* ======================================================== */}
      {createEventModal && (
        <div
          onClick={() => setCreateEventModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3,3,5,0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              borderRadius: '24px',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              maxWidth: '620px',
              width: '100%',
              padding: '2rem',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h3 className="font-display gold-text" style={{ fontSize: '1.5rem', marginBottom: '1.25rem' }}>
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </h3>

            <form onSubmit={handleSaveEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Event Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Code Crypt"
                  value={eventForm.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setEventForm({ ...eventForm, title, slug: editingEvent ? eventForm.slug : slug });
                  }}
                  className="neu-input"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>URL Slug *</label>
                <input
                  type="text"
                  placeholder="code-crypt"
                  value={eventForm.slug}
                  onChange={(e) => setEventForm({ ...eventForm, slug: e.target.value })}
                  className="neu-input"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Description *</label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="neu-input"
                  rows={3}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Event Type</label>
                  <select
                    value={eventForm.event_type}
                    onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value })}
                    className="neu-input"
                  >
                    <option value="INDIVIDUAL">Individual / Solo</option>
                    <option value="TEAM">Group / Team</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Registration Fee (₹) [Per Event]</label>
                  <input
                    type="number"
                    min="0"
                    value={eventForm.registration_fee}
                    onChange={(e) => setEventForm({ ...eventForm, registration_fee: e.target.value })}
                    className="neu-input"
                  />
                </div>
              </div>

              {eventForm.event_type === 'TEAM' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Min Team Size</label>
                    <input
                      type="number"
                      min="1"
                      value={eventForm.min_team_size}
                      onChange={(e) => setEventForm({ ...eventForm, min_team_size: e.target.value })}
                      className="neu-input"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Max Team Size</label>
                    <input
                      type="number"
                      min="1"
                      value={eventForm.max_team_size}
                      onChange={(e) => setEventForm({ ...eventForm, max_team_size: e.target.value })}
                      className="neu-input"
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Start Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 10:00 AM"
                    value={eventForm.start_time}
                    onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
                    className="neu-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>End Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 01:00 PM"
                    value={eventForm.end_time}
                    onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })}
                    className="neu-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Venue *</label>
                  <input
                    type="text"
                    placeholder="Auditorium"
                    value={eventForm.venue}
                    onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                    className="neu-input"
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Event Date *</label>
                  <input
                    type="datetime-local"
                    value={eventForm.event_date}
                    onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                    className="neu-input"
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Rules & Guidelines</label>
                <textarea
                  placeholder="Enter rules to be shown to participants before registration..."
                  value={eventForm.rules}
                  onChange={(e) => setEventForm({ ...eventForm, rules: e.target.value })}
                  className="neu-input"
                  rows={3}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setCreateEventModal(false)} className="neu-btn">
                  Cancel
                </button>
                <button type="submit" className="neu-btn-gold">
                  {editingEvent ? 'Update Event' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ASSIGN VOLUNTEERS                                 */}
      {/* ======================================================== */}
      {assignModalOpen && selectedEventForAssign && (
        <div
          onClick={() => setAssignModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3,3,5,0.85)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              borderRadius: '20px',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              maxWidth: '460px',
              width: '100%',
              padding: '2rem',
            }}
          >
            <h3 className="font-display gold-text" style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>
              Assign Volunteers
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Select volunteers for <strong>{selectedEventForAssign.title}</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '250px', overflowY: 'auto', marginBottom: '1.5rem' }}>
              {volunteers.map((vol) => {
                const isChecked = selectedVolunteerIds.includes(vol.id);
                return (
                  <label
                    key={vol.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      background: 'var(--bg-inset)',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedVolunteerIds([...selectedVolunteerIds, vol.id]);
                        } else {
                          setSelectedVolunteerIds(selectedVolunteerIds.filter((id) => id !== vol.id));
                        }
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-white)' }}>{vol.full_name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{vol.email}</div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button onClick={() => setAssignModalOpen(false)} className="neu-btn">
                Cancel
              </button>
              <button onClick={handleSaveVolunteerAssignment} className="neu-btn-gold">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: INSPECT REGISTRATION / TEAM DETAILS               */}
      {/* ======================================================== */}
      {inspectRegistration && (
        <div
          onClick={() => setInspectRegistration(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3,3,5,0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              borderRadius: '24px',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              maxWidth: '540px',
              width: '100%',
              padding: '2.25rem',
            }}
          >
            <h3 className="font-display gold-text" style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>
              Registration Summary
            </h3>

            <div style={{ background: 'var(--bg-inset)', padding: '1.25rem', borderRadius: '14px', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="font-mono" style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--gold-bright)' }}>
                  {inspectRegistration.registration_code}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    background: inspectRegistration.payment_mode === 'OFFLINE' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                    color: inspectRegistration.payment_mode === 'OFFLINE' ? 'var(--gold-bright)' : '#60A5FA',
                    fontWeight: '700',
                  }}
                >
                  {inspectRegistration.payment_mode === 'OFFLINE' ? 'Cash Payment' : 'Online Gateway'}
                </span>
              </div>

              <div style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-white)', marginTop: '0.4rem' }}>
                {inspectRegistration.primary_name}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {inspectRegistration.college_name} {inspectRegistration.course_and_semester && `• ${inspectRegistration.course_and_semester}`}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                {inspectRegistration.primary_email} • {inspectRegistration.primary_phone}
              </div>
            </div>

            {inspectRegistration.team_members && inspectRegistration.team_members.length > 0 && (
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--gold-bright)', marginBottom: '0.65rem', textTransform: 'uppercase' }}>
                  Teammates ({inspectRegistration.team_members.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {inspectRegistration.team_members.map((m, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-inset)', padding: '0.75rem 0.95rem', borderRadius: '10px', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <div style={{ fontWeight: '700', color: 'var(--text-white)' }}>#{idx + 2} {m.full_name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--gold-light)' }}>📞 {m.phone}</div>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>✉️ {m.email}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        🏫 {m.college_name} {m.department ? `• ${m.department}` : ''} {m.course_and_semester ? `• ${m.course_and_semester}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setInspectRegistration(null)} className="neu-btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
