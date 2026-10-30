import React, { useEffect, useState, useMemo, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import DigitalTicketPass from '../components/DigitalTicketPass';
import LoadingOverlay from '../components/LoadingOverlay';
import AsthraLogo from '../components/AsthraLogo';
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
  EyeOff,
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
  RotateCw,
  TrendingUp,
  BarChart3,
  PieChart,
  Award,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend as RechartsLegend,
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts';

export default function VolunteerPortal({ activeSection = 'status', onSelectSection }) {
  const { user, loading: authLoading, login } = useAuth();
  const toast = useToast();

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // Volunteer & Event data
  const [assignedEvents, setAssignedEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(() => {
    return sessionStorage.getItem('asthra_volunteer_selected_event') || '';
  });
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
  const [adminEventsLoading, setAdminEventsLoading] = useState(false);
  const [volunteers, setVolunteers] = useState([]);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsLastUpdated, setStatsLastUpdated] = useState(null);
  const [analyticsSearch, setAnalyticsSearch] = useState('');
  const [analyticsFilterType, setAnalyticsFilterType] = useState('ALL'); // 'ALL' | 'TEAM' | 'INDIVIDUAL'
  const [analyticsSortBy, setAnalyticsSortBy] = useState('revenue_desc'); // 'revenue_desc' | 'regs_desc' | 'turnout_desc' | 'title_asc'
  const [chartViewMode, setChartViewMode] = useState('revenue'); // 'revenue' | 'channels' | 'registrations'

  // Admin Participant Filters
  const [participantFilterEvent, setParticipantFilterEvent] = useState('ALL');
  const [participantFilterAttendance, setParticipantFilterAttendance] = useState('ALL');
  const [participantFilterPaymentMode, setParticipantFilterPaymentMode] = useState('ALL');
  const [participantFilterPaymentStatus, setParticipantFilterPaymentStatus] = useState('SUCCESS');
  const [participantSearch, setParticipantSearch] = useState('');
  const [adminRegistrations, setAdminRegistrations] = useState([]);
  const [adminRegLoading, setAdminRegLoading] = useState(false);

  // Manual Spot Registration state
  const [manualEventId, setManualEventId] = useState(() => {
    return sessionStorage.getItem('asthra_manual_event_id') || '';
  });
  const [manualDropdownOpen, setManualDropdownOpen] = useState(false);
  const manualDropdownRef = useRef(null);
  const [manualPaymentMode, setManualPaymentMode] = useState('OFFLINE'); // 'OFFLINE' | 'ONLINE'
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualSuccessTicket, setManualSuccessTicket] = useState(null);
  const [manualOnlineOrder, setManualOnlineOrder] = useState(null);
  const [verifyingOnline, setVerifyingOnline] = useState(false);
  const [portalActionLoading, setPortalActionLoading] = useState(null);
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

  // Admin Credentials Change State
  const [adminCredForm, setAdminCredForm] = useState({
    username: user?.username || 'admin',
    newPassword: '',
    confirmPassword: '',
    currentPassword: '',
  });
  const [credUpdating, setCredUpdating] = useState(false);

  useEffect(() => {
    if (user?.username) {
      setAdminCredForm((prev) => ({ ...prev, username: user.username }));
    }
  }, [user]);

  const handleChangeAdminCredentials = async (e) => {
    e.preventDefault();
    if (adminCredForm.newPassword) {
      if (adminCredForm.newPassword.length < 4) {
        toast.error('New password must be at least 4 characters long.');
        return;
      }
      if (adminCredForm.newPassword !== adminCredForm.confirmPassword) {
        toast.error('New passwords do not match.');
        return;
      }
      if (!adminCredForm.currentPassword) {
        toast.error('Please enter your current password to confirm the password change.');
        return;
      }
    }

    try {
      setCredUpdating(true);
      const payload = {};
      if (adminCredForm.username.trim() && adminCredForm.username.trim() !== (user?.username || '')) {
        payload.new_username = adminCredForm.username.trim();
      }
      if (adminCredForm.newPassword) {
        payload.new_password = adminCredForm.newPassword;
        payload.current_password = adminCredForm.currentPassword;
      }

      if (Object.keys(payload).length === 0) {
        toast.info('No changes were entered.');
        return;
      }

      const updated = await api.changeCredentials(payload);
      toast.success('Admin credentials updated successfully!');
      setAdminCredForm({
        username: updated.username || adminCredForm.username,
        newPassword: '',
        confirmPassword: '',
        currentPassword: '',
      });
      if (user && updated.username) {
        user.username = updated.username;
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update credentials.');
    } finally {
      setCredUpdating(false);
    }
  };

  const isAdmin = user && (user.role === 'ADMIN' || user.id === '00000000-0000-0000-0000-000000000001');

  // If non-admin user lands on an admin-only section, redirect them gracefully to 'status'
  useEffect(() => {
    if (user && !isAdmin) {
      const adminSections = ['participants', 'events', 'stats', 'volunteers', 'settings'];
      if (adminSections.includes(activeSection)) {
        onSelectSection?.('status');
      }
    }
  }, [user, isAdmin, activeSection, onSelectSection]);

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
      sessionStorage.setItem('asthra_volunteer_selected_event', selectedEventId);
      fetchEventRegistrations(selectedEventId);
    }
  }, [selectedEventId]);

  useEffect(() => {
    if (manualEventId) {
      sessionStorage.setItem('asthra_manual_event_id', manualEventId);
    }
  }, [manualEventId]);

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

  // Load all participants when admin enters 'participants' tab or dropdown filters change
  useEffect(() => {
    if (isAdmin && activeSection === 'participants') {
      fetchAdminRegistrations();
    }
  }, [activeSection, isAdmin, participantFilterEvent, participantFilterAttendance, participantFilterPaymentMode, participantFilterPaymentStatus]);

  // Load events with spinner when admin enters 'events' tab
  useEffect(() => {
    if (isAdmin && activeSection === 'events') {
      loadAdminEvents();
    }
  }, [activeSection, isAdmin]);

  // Auto-refresh analytics with live fest data when admin enters 'stats' tab
  useEffect(() => {
    if (isAdmin && activeSection === 'stats') {
      fetchStats();
    }
  }, [activeSection, isAdmin]);

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
      if (events && events.length > 0) {
        const savedEventId = sessionStorage.getItem('asthra_volunteer_selected_event');
        const match = events.find((e) => e.id === savedEventId);
        if (match) {
          setSelectedEventId(match.id);
        } else if (!selectedEventId) {
          setSelectedEventId(events[0].id);
        }

        const savedManualId = sessionStorage.getItem('asthra_manual_event_id');
        const manualMatch = events.find((e) => e.id === savedManualId);
        if (manualMatch) {
          setManualEventId(manualMatch.id);
        } else if (!manualEventId) {
          setManualEventId(events[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load volunteer events:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminEvents = async () => {
    try {
      setAdminEventsLoading(true);
      const allEvs = await api.getEvents({ include_inactive: true });
      setAllEvents(allEvs || []);
      if (allEvs && allEvs.length > 0 && !manualEventId) {
        const savedManualId = sessionStorage.getItem('asthra_manual_event_id');
        const manualMatch = allEvs.find((e) => e.id === savedManualId);
        setManualEventId(manualMatch ? manualMatch.id : allEvs[0].id);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setAdminEventsLoading(false);
    }
  };

  const fetchStats = async (showToast = false) => {
    try {
      setStatsLoading(true);
      const overviewStats = await api.getOverviewStats();
      setStats(overviewStats);
      setStatsLastUpdated(new Date());
      if (showToast) {
        toast.success('Analytics updated with live fest data!');
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
      if (showToast) {
        toast.error('Failed to refresh analytics.');
      }
    } finally {
      setStatsLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      const [allEvs, vols, overviewStats] = await Promise.all([
        api.getEvents({ include_inactive: true }).catch(() => []),
        api.getVolunteers().catch(() => []),
        api.getOverviewStats().catch(() => null),
      ]);
      setAllEvents(allEvs || []);
      setVolunteers(vols || []);
      setStats(overviewStats);
      setStatsLastUpdated(new Date());
      if (allEvs && allEvs.length > 0) {
        const savedManualId = sessionStorage.getItem('asthra_manual_event_id');
        const manualMatch = allEvs.find((e) => e.id === savedManualId);
        if (manualMatch) {
          setManualEventId(manualMatch.id);
        } else if (!manualEventId) {
          setManualEventId(allEvs[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  const fetchEventRegistrations = async (eventId) => {
    try {
      setLoading(true);
      const data = await api.getRegistrations({ event_id: eventId, payment_status: 'SUCCESS' });
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
      if (participantFilterPaymentStatus !== 'ALL') params.payment_status = participantFilterPaymentStatus;

      const data = await api.getRegistrations(params);
      setAdminRegistrations(data || []);
    } catch (err) {
      console.error('Failed to fetch admin registrations:', err);
    } finally {
      setAdminRegLoading(false);
    }
  };

  const handleToggleAttendance = async (reg) => {
    if (reg.payment_status && reg.payment_status !== 'SUCCESS') {
      toast.error('Cannot check in: Participant has not completed payment.');
      return;
    }

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
        setPortalActionLoading({
          message: 'Archiving Participant...',
          subtext: `Hiding ${reg.primary_name} from active roster...`,
        });
        await api.updateAttendance(reg.id, 'HIDDEN');
        toast.success(`Participant "${reg.primary_name}" is now hidden.`);
        fetchAdminRegistrations();
        if (selectedEventId) fetchEventRegistrations(selectedEventId);
      } catch (err) {
        toast.error(`Failed to hide participant: ${err.message}`);
      } finally {
        setPortalActionLoading(null);
      }
    } else {
      if (!confirm(`Permanently DELETE participant "${reg.primary_name}"? This action CANNOT be undone.`)) return;
      try {
        setPortalActionLoading({
          message: 'Deleting Participant...',
          subtext: `Permanently removing ${reg.primary_name}...`,
        });
        await api.deleteRegistration(reg.id);
        toast.success(`Participant "${reg.primary_name}" permanently deleted.`);
        fetchAdminRegistrations();
        if (selectedEventId) fetchEventRegistrations(selectedEventId);
      } catch (err) {
        toast.error(`Failed to delete participant: ${err.message}`);
      } finally {
        setPortalActionLoading(null);
      }
    }
  };

  const handleRestoreParticipant = async (reg) => {
    try {
      setPortalActionLoading({
        message: 'Restoring Participant...',
        subtext: `Returning ${reg.primary_name} to active roster...`,
      });
      await api.updateAttendance(reg.id, 'NOT_ATTENDED');
      toast.success(`Restored participant "${reg.primary_name}" to active roster.`);
      fetchAdminRegistrations();
      if (selectedEventId) fetchEventRegistrations(selectedEventId);
    } catch (err) {
      toast.error(`Failed to restore participant: ${err.message}`);
    } finally {
      setPortalActionLoading(null);
    }
  };

  // Excel Export Handlers (teammates included as separate participant rows)
  const [exportingExcel, setExportingExcel] = useState(false);

  const handleExportFilteredParticipantsExcel = async () => {
    try {
      setExportingExcel(true);
      toast.info('Generating Excel workbook with individual teammate details...');
      await api.downloadRegistrationsExcel({
        event_id: participantFilterEvent,
        attendance_status: participantFilterAttendance,
        payment_mode: participantFilterPaymentMode,
        payment_status: participantFilterPaymentStatus,
        search: participantSearch.trim(),
        filename: `Asthra26_Participants_${new Date().toISOString().slice(0, 10)}.xlsx`,
      });
      toast.success('Excel workbook downloaded successfully!');
    } catch (err) {
      console.error('Export error:', err);
      toast.error(err.message || 'Failed to export Excel file');
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportEventRosterExcel = async (eventId, eventTitle) => {
    try {
      setExportingExcel(true);
      toast.info(`Generating Excel roster for "${eventTitle || 'Event'}"...`);
      await api.downloadRegistrationsExcel({
        event_id: eventId,
        payment_status: 'SUCCESS',
        filename: `Asthra26_${(eventTitle || 'Event').replace(/[^a-zA-Z0-9]/g, '_')}_Roster.xlsx`,
      });
      toast.success(`Roster for "${eventTitle || 'Event'}" downloaded!`);
    } catch (err) {
      console.error('Event export error:', err);
      toast.error(err.message || 'Failed to export event roster');
    } finally {
      setExportingExcel(false);
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
      setPortalActionLoading({
        message: editingEvent ? 'Updating Competition...' : 'Creating Competition...',
        subtext: 'Syncing event details and schedule with server...',
      });
      const payload = {
        ...eventForm,
        registration_fee: parseFloat(eventForm.registration_fee || 0),
        min_team_size: eventForm.event_type === 'INDIVIDUAL' ? 1 : parseInt(eventForm.min_team_size || 1),
        max_team_size: eventForm.event_type === 'INDIVIDUAL' ? 1 : parseInt(eventForm.max_team_size || 1),
        max_capacity: parseInt(eventForm.max_capacity) || null,
        registration_deadline: eventForm.registration_deadline
          ? new Date(eventForm.registration_deadline).toISOString()
          : new Date(Date.now() + 365 * 86400000).toISOString(),
        event_date: new Date(eventForm.event_date).toISOString(),
      };

      if (editingEvent) {
        const updated = await api.updateEvent(editingEvent.id, payload);
        toast.success(`Updated event: ${payload.title}`);
        setAllEvents((prev) =>
          prev.map((ev) => (ev.id === editingEvent.id ? { ...ev, ...updated } : ev))
        );
      } else {
        const created = await api.createEvent(payload);
        toast.success(`Created event: ${payload.title}`);
        setAllEvents((prev) => [created, ...prev.filter((ev) => ev.id !== created.id)]);
      }

      setCreateEventModal(false);
      await Promise.all([
        loadAdminEvents(),
        loadVolunteerData(),
      ]);
    } catch (err) {
      toast.error(`Failed to save event: ${err.message}`);
    } finally {
      setPortalActionLoading(null);
    }
  };

  const handleToggleEventActive = async (ev) => {
    const nextActive = !ev.is_active;
    if (!nextActive) {
      if (!confirm(`Are you sure you want to deactivate "${ev.title}"? It will be dimmed and hidden from participant registration.`)) return;
    }
    try {
      setPortalActionLoading({
        message: `${nextActive ? 'Activating' : 'Deactivating'} Competition...`,
        subtext: `Updating "${ev.title}" status on server...`,
      });
      await api.updateEvent(ev.id, { is_active: nextActive });
      setAllEvents((prev) =>
        prev.map((item) => (item.id === ev.id ? { ...item, is_active: nextActive } : item))
      );
      toast.success(`Event "${ev.title}" is now ${nextActive ? 'Active' : 'Deactivated'}.`);
      loadAdminData();
      loadVolunteerData();
    } catch (err) {
      toast.error(`Failed to update event: ${err.message}`);
    } finally {
      setPortalActionLoading(null);
    }
  };

  // Volunteer accounts
  const handleCreateVolunteer = async (e) => {
    e.preventDefault();
    try {
      setPortalActionLoading({
        message: 'Creating Volunteer Account...',
        subtext: 'Provisioning secure portal credentials...',
      });
      await api.createVolunteer(newVolForm);
      setNewVolForm({ full_name: '', email: '', phone: '', password: '' });
      toast.success('Volunteer account created successfully!');
      loadAdminData();
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setPortalActionLoading(null);
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
      setPortalActionLoading({
        message: 'Assigning Volunteers...',
        subtext: 'Updating coordinator permissions on server...',
      });
      await api.assignVolunteers(selectedEventForAssign.id, selectedVolunteerIds);
      setAssignModalOpen(false);
      toast.success('Volunteers assigned successfully!');
      loadAdminData();
      loadVolunteerData();
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setPortalActionLoading(null);
    }
  };

  // Manual Spot Registration Handlers
  const availableManualEvents = (isAdmin ? allEvents : assignedEvents).filter((e) => e.is_active !== false);
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

    const primaryPhoneClean = manualForm.primary_phone.replace(/\D/g, '');
    if (primaryPhoneClean.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number for primary participant');
      return;
    }

    if (isManualTeam) {
      for (let i = 0; i < manualForm.team_members.length; i++) {
        const tm = manualForm.team_members[i];
        if (tm.phone.replace(/\D/g, '').length < 10) {
          toast.error(`Please enter a valid 10-digit mobile number for Teammate #${i + 1}`);
          return;
        }
      }
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
      setVerifyingOnline(true);
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
    } finally {
      setVerifyingOnline(false);
    }
  };

  // Filter registrations in event status view based on selected filters and search query
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((r) => {
      // 0. Only show confirmed paid registrations in the check-in list
      if (r.payment_status && r.payment_status !== 'SUCCESS') return false;

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

  const validRegistrations = useMemo(() => {
    return registrations.filter((r) => !r.payment_status || r.payment_status === 'SUCCESS');
  }, [registrations]);

  const attendedCount = validRegistrations.filter((r) => r.attendance_status === 'PRESENT').length;

  // Instant in-memory search for Admin Participants tab without reloading / spinner
  const filteredAdminRegistrations = useMemo(() => {
    if (!participantSearch.trim()) return adminRegistrations;
    const term = participantSearch.toLowerCase().trim();
    return adminRegistrations.filter((r) => {
      const matchName = r.primary_name?.toLowerCase().includes(term);
      const matchCode = r.registration_code?.toLowerCase().includes(term);
      const matchPhone = r.primary_phone?.includes(term);
      const matchEmail = r.primary_email?.toLowerCase().includes(term);
      const matchCollege = r.college_name?.toLowerCase().includes(term);
      const matchCourse = r.course_and_semester?.toLowerCase().includes(term);
      const matchEvent = r.event_title?.toLowerCase().includes(term);
      const matchTeam = r.team_name?.toLowerCase().includes(term);
      const matchTeammates = r.team_members?.some((m) =>
        m.full_name?.toLowerCase().includes(term) ||
        m.phone?.includes(term) ||
        m.email?.toLowerCase().includes(term)
      );
      return (
        matchName ||
        matchCode ||
        matchPhone ||
        matchEmail ||
        matchCollege ||
        matchCourse ||
        matchEvent ||
        matchTeam ||
        matchTeammates
      );
    });
  }, [adminRegistrations, participantSearch]);

  // 1. IF AUTH SESSION IS CURRENTLY INITIALIZING/VERIFYING (e.g. on page refresh), NEVER FLASH LOGIN FORM
  if (authLoading && !user) {
    return (
      <div
        style={{
          minHeight: '75vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LoadingOverlay
          active={true}
          message="Authenticating Session..."
          subtext="Verifying security credentials..."
        />
      </div>
    );
  }

  // 2. SIGN IN SCREEN ONLY IF NOT AUTHENTICATED
  if (!user) {
    return (
      <>
        <LoadingOverlay
          active={loginLoading}
          message="Signing In..."
          subtext="Verifying volunteer credentials & security permissions..."
        />
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <AsthraLogo size={62} />
            </div>

            <h2
              className="font-display gold-text-glow"
              style={{
                fontSize: '1.85rem',
                fontWeight: '800',
                marginBottom: '1.75rem',
                letterSpacing: '0.04em',
              }}
            >
              Sign In
            </h2>

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
                  placeholder="Username"
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
          </div>
        </div>
      </>
    );
  }

  // 2. LOGGED IN PORTAL VIEWS
  return (
    <>
      {/* Loading Overlays with Blurred Backdrop and Asthra Aztec Gold Theme */}
      <LoadingOverlay
        active={loading && assignedEvents.length === 0}
        message="Loading Assigned Events..."
        subtext="Fetching coordinator permissions and event rosters..."
      />

      <LoadingOverlay
        active={manualSubmitting}
        message="Processing Spot Registration..."
        subtext="Generating official digital ticket & recording entry..."
      />

      <LoadingOverlay
        active={verifyingOnline}
        message="Verifying Online Payment..."
        subtext="Querying Cashfree gateway for transaction receipt..."
      />

      <LoadingOverlay
        active={Boolean(updatingId)}
        message="Updating Attendance..."
        subtext="Synchronizing participant entry status..."
      />



      <LoadingOverlay
        active={Boolean(portalActionLoading)}
        message={portalActionLoading?.message || 'Processing Request...'}
        subtext={portalActionLoading?.subtext || 'Please wait while we communicate with the server...'}
      />

      <LoadingOverlay
        active={credUpdating}
      />

      <div className="portal-content-container" style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* ======================================================== */}
        {/* 1. SECTION: VIEW EVENT STATUS (Attendance check-in)       */}
        {/* ======================================================== */}
        {activeSection === 'status' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 className="font-display gold-text-glow" style={{ fontSize: '2.2rem', fontWeight: '800', lineHeight: 1.2 }}>
                  Event Status & Check-In
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Select an event below to view registrations and check mark participants entering the event hall.
                </p>
              </div>

              {selectedEventId && (
                <button
                  type="button"
                  disabled={exportingExcel || validRegistrations.length === 0}
                  onClick={() => {
                    const ev = assignedEvents.find((e) => e.id === selectedEventId);
                    handleExportEventRosterExcel(selectedEventId, ev?.title || 'Event');
                  }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.16) 0%, rgba(170, 124, 17, 0.28) 100%)',
                    border: '1.5px solid rgba(212, 175, 55, 0.5)',
                    color: 'var(--gold-bright)',
                    padding: '0.65rem 1.25rem',
                    borderRadius: '12px',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    cursor: (exportingExcel || validRegistrations.length === 0) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    opacity: (exportingExcel || validRegistrations.length === 0) ? 0.6 : 1,
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!exportingExcel && validRegistrations.length > 0) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%)';
                      e.currentTarget.style.color = '#000';
                      e.currentTarget.style.boxShadow = '0 0 18px rgba(212, 175, 55, 0.45)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!exportingExcel && validRegistrations.length > 0) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212, 175, 55, 0.16) 0%, rgba(170, 124, 17, 0.28) 100%)';
                      e.currentTarget.style.color = 'var(--gold-bright)';
                      e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.35)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                  title="Download this event's check-in roster as Excel (.xlsx) with teammates as separate rows"
                >
                  <FileSpreadsheet size={17} />
                  <span>{exportingExcel ? 'Exporting...' : 'Export Event Roster (.xlsx)'}</span>
                </button>
              )}
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
                <div className="responsive-stat-bar">
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Registered</div>
                    <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-white)' }}>
                      {validRegistrations.length}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Entered Hall</div>
                    <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: '800', color: '#34D399' }}>
                      {attendedCount} / {validRegistrations.length} ({validRegistrations.length > 0 ? Math.round((attendedCount / validRegistrations.length) * 100) : 0}%)
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending Check-In</div>
                    <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--gold-bright)' }}>
                      {validRegistrations.length - attendedCount}
                    </div>
                  </div>
                </div>

                {/* Event Dropdown & Multi-Filter Control Bar (under the progress div) */}
                <div className="responsive-filter-bar">
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
                  <Search
                    size={18}
                    style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--gold-bright)',
                      opacity: 0.85,
                      pointerEvents: 'none',
                    }}
                  />
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
                          className="attendee-card"
                          style={{
                            borderLeft: isPresent ? '4px solid #10B981' : '4px solid rgba(212, 175, 55, 0.4)',
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
                                  background:
                                    reg.payment_status === 'SUCCESS'
                                      ? (reg.payment_mode === 'OFFLINE' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(16, 185, 129, 0.15)')
                                      : 'rgba(245, 158, 11, 0.15)',
                                  color:
                                    reg.payment_status === 'SUCCESS'
                                      ? (reg.payment_mode === 'OFFLINE' ? 'var(--gold-bright)' : '#10B981')
                                      : '#F59E0B',
                                  border:
                                    reg.payment_status === 'SUCCESS'
                                      ? (reg.payment_mode === 'OFFLINE' ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)')
                                      : '1px solid rgba(245, 158, 11, 0.35)',
                                  fontWeight: '700',
                                }}
                              >
                                {reg.payment_status === 'SUCCESS'
                                  ? (reg.payment_mode === 'OFFLINE' ? '✓ Paid (Cash)' : '✓ Paid (Online)')
                                  : '⏳ Unpaid / Pending'}
                              </span>
                            </div>

                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                              <span>📞 {reg.primary_phone}</span>
                              <span>🏫 {reg.college_name}</span>
                              {reg.course_and_semester && <span>📚 {reg.course_and_semester}</span>}
                            </div>
                          </div>

                          {/* Action Buttons: Fixed width container on desktop, stacked grid on mobile */}
                          <div className="attendee-card-actions">
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
                              disabled={updatingId === reg.id || (isPresent && !isAdmin) || (reg.payment_status && reg.payment_status !== 'SUCCESS')}
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
              <div className="volunteer-form-card" style={{ background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid rgba(212, 175, 55, 0.25)', padding: '2rem', boxShadow: 'var(--neu-shadow-flat)' }}>
                <form onSubmit={handleManualSubmit}>
                  {/* Horizontal 2-Column Form Layout: Minimizes vertical scrolling */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '0.85rem' }}>
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
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '0.85rem' }}>
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
                            inputMode="numeric"
                            pattern="[0-9]{10}"
                            maxLength={10}
                            placeholder="10-digit mobile"
                            value={manualForm.primary_phone}
                            onChange={(e) => setManualForm({ ...manualForm, primary_phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                            className="neu-input"
                            style={{ padding: '0.65rem 0.95rem', fontSize: '0.85rem' }}
                            required
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '0.85rem' }}>
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

                      <div style={{ display: 'grid', gridTemplateColumns: isManualTeam ? 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))' : '1fr', gap: '0.85rem' }}>
                        <div>
                          <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>
                            Semester *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Semester 6"
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
                          <div style={{ marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--gold-bright)' }}>
                              Teammates ({1 + manualForm.team_members.length} / {currentSelectedManualEvent?.max_team_size})
                            </span>
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
                                  inputMode="numeric"
                                  pattern="[0-9]{10}"
                                  maxLength={10}
                                  placeholder="10-digit phone"
                                  value={tm.phone}
                                  onChange={(e) => handleManualTeammateChange(idx, 'phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                  className="neu-input"
                                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                                  required
                                />
                              </div>
                            </div>
                          ))}

                          {1 + manualForm.team_members.length < (currentSelectedManualEvent?.max_team_size || 1) && (
                            <button
                              type="button"
                              onClick={handleManualAddTeammate}
                              className="glass-btn"
                              style={{
                                width: '100%',
                                fontSize: '0.78rem',
                                padding: '0.55rem',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.35rem',
                                border: '1px dashed rgba(212, 175, 55, 0.4)',
                                color: 'var(--gold-bright)',
                                cursor: 'pointer',
                                marginBottom: '0.5rem',
                              }}
                            >
                              <Plus size={14} />
                              <span>Add Teammate</span>
                            </button>
                          )}
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

              {/* Actions & Quick stats counter */}
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  disabled={exportingExcel || filteredAdminRegistrations.length === 0}
                  onClick={handleExportFilteredParticipantsExcel}
                  style={{
                    background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.16) 0%, rgba(170, 124, 17, 0.28) 100%)',
                    border: '1.5px solid rgba(212, 175, 55, 0.5)',
                    color: 'var(--gold-bright)',
                    padding: '0.65rem 1.25rem',
                    borderRadius: '12px',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    cursor: (exportingExcel || filteredAdminRegistrations.length === 0) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    opacity: (exportingExcel || filteredAdminRegistrations.length === 0) ? 0.6 : 1,
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!exportingExcel && filteredAdminRegistrations.length > 0) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%)';
                      e.currentTarget.style.color = '#000';
                      e.currentTarget.style.boxShadow = '0 0 18px rgba(212, 175, 55, 0.45)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!exportingExcel && filteredAdminRegistrations.length > 0) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212, 175, 55, 0.16) 0%, rgba(170, 124, 17, 0.28) 100%)';
                      e.currentTarget.style.color = 'var(--gold-bright)';
                      e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.35)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                  title="Download filtered participants as styled Excel (.xlsx) with teammates as separate rows"
                >
                  <FileSpreadsheet size={17} />
                  <span>{exportingExcel ? 'Exporting...' : 'Export to Excel (.xlsx)'}</span>
                </button>

                <div style={{ background: 'var(--bg-card)', padding: '0.65rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Filtered Count</div>
                  <div className="font-mono" style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--gold-bright)' }}>
                    {filteredAdminRegistrations.length}
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

              {/* Payment Status Filter */}
              <div style={{ flex: '1 1 180px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--gold-bright)', display: 'block', marginBottom: '0.35rem', letterSpacing: '0.04em' }}>
                  Payment Status
                </label>
                <select
                  value={participantFilterPaymentStatus}
                  onChange={(e) => setParticipantFilterPaymentStatus(e.target.value)}
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
                  <option value="SUCCESS" style={{ background: '#0d0d16', color: '#10B981', fontWeight: '700' }}>✓ Confirmed (Paid)</option>
                  <option value="ALL" style={{ background: '#0d0d16', color: '#f3f4f6' }}>All Statuses</option>
                  <option value="PENDING" style={{ background: '#0d0d16', color: '#F59E0B' }}>⏳ Payment Pending</option>
                  <option value="FAILED" style={{ background: '#0d0d16', color: '#EF4444' }}>✕ Payment Failed</option>
                </select>
              </div>

              {/* Search Input */}
              <div style={{ flex: '2 1 240px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--gold-bright)', display: 'block', marginBottom: '0.35rem', letterSpacing: '0.04em' }}>
                  Search
                </label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <Search
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--gold-bright)',
                      opacity: 0.8,
                      pointerEvents: 'none',
                    }}
                  />
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
                      padding: '0.55rem 0.85rem 0.55rem 2.4rem',
                      fontSize: '0.82rem',
                      fontWeight: '500',
                      color: 'var(--text-white)',
                      outline: 'none',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Participants Table */}
            {adminRegLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Loading participants...
              </div>
            ) : filteredAdminRegistrations.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '16px', color: 'var(--text-secondary)' }}>
                {participantSearch.trim()
                  ? `No participants found matching "${participantSearch.trim()}".`
                  : 'No participants match the selected filter criteria.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredAdminRegistrations.map((reg) => {
                  const isPresent = reg.attendance_status === 'PRESENT';
                  const isHidden = reg.attendance_status === 'HIDDEN';
                  return (
                    <div
                      key={reg.id}
                      className="admin-participant-card"
                      style={{
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
                              padding: '0.15rem 0.5rem',
                              borderRadius: '6px',
                              background:
                                reg.payment_status === 'SUCCESS'
                                  ? (reg.payment_mode === 'OFFLINE' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(16, 185, 129, 0.15)')
                                  : reg.payment_status === 'PENDING'
                                    ? 'rgba(245, 158, 11, 0.15)'
                                    : 'rgba(239, 68, 68, 0.15)',
                              color:
                                reg.payment_status === 'SUCCESS'
                                  ? (reg.payment_mode === 'OFFLINE' ? 'var(--gold-bright)' : '#10B981')
                                  : reg.payment_status === 'PENDING'
                                    ? '#F59E0B'
                                    : '#EF4444',
                              border:
                                reg.payment_status === 'SUCCESS'
                                  ? (reg.payment_mode === 'OFFLINE' ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)')
                                  : reg.payment_status === 'PENDING'
                                    ? '1px solid rgba(245, 158, 11, 0.35)'
                                    : '1px solid rgba(239, 68, 68, 0.35)',
                              fontWeight: '700',
                            }}
                          >
                            {reg.payment_status === 'SUCCESS'
                              ? (reg.payment_mode === 'OFFLINE' ? '✓ Cash (Paid)' : '✓ Online (Paid)')
                              : reg.payment_status === 'PENDING'
                                ? '⏳ Unpaid / Pending'
                                : '✕ Payment Failed'}
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

                      <div className="admin-participant-actions">
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

            {adminEventsLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Loading events...
              </div>
            ) : allEvents.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '16px', color: 'var(--text-secondary)' }}>
                No events created yet. Click "Create Event" above to create your first competition.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {allEvents.map((ev) => {
                  const isDeactivated = ev.is_active === false;
                  return (
                    <div
                      key={ev.id}
                      style={{
                        background: isDeactivated ? 'rgba(18, 18, 26, 0.8)' : 'var(--bg-card)',
                        borderRadius: '20px',
                        border: isDeactivated ? '1.5px dashed rgba(239, 68, 68, 0.35)' : '1px solid rgba(212, 175, 55, 0.2)',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: isDeactivated ? '0 4px 18px rgba(0, 0, 0, 0.45)' : 'var(--neu-shadow-flat)',
                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        position: 'relative',
                      }}
                    >
                      <div style={{ opacity: isDeactivated ? 0.45 : 1, transition: 'opacity 0.2s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <h3 className="font-display gold-text" style={{ fontSize: '1.3rem', fontWeight: '700', color: isDeactivated ? '#9CA3AF' : undefined }}>
                              {ev.title}
                            </h3>
                            {isDeactivated ? (
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '0.15rem 0.55rem',
                                  borderRadius: '6px',
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  border: '1px solid rgba(239, 68, 68, 0.35)',
                                  color: '#F87171',
                                  fontWeight: '700',
                                  letterSpacing: '0.04em',
                                  textTransform: 'uppercase',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                }}
                              >
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
                                Inactive
                              </span>
                            ) : (
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '0.15rem 0.55rem',
                                  borderRadius: '6px',
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  border: '1px solid rgba(16, 185, 129, 0.35)',
                                  color: '#34D399',
                                  fontWeight: '700',
                                  letterSpacing: '0.04em',
                                  textTransform: 'uppercase',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                }}
                              >
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                                Active
                              </span>
                            )}
                          </div>
                          <span className="font-mono" style={{ fontSize: '1.1rem', fontWeight: '800', color: isDeactivated ? '#9CA3AF' : 'var(--gold-bright)' }}>
                            ₹{parseFloat(ev.registration_fee || 0).toFixed(0)}
                          </span>
                        </div>

                        <p style={{ fontSize: '0.85rem', color: isDeactivated ? '#6B7280' : 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                          {ev.description}
                        </p>

                        <div style={{ fontSize: '0.78rem', color: isDeactivated ? '#6B7280' : 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.25rem' }}>
                          <div>📍 {ev.venue || 'Main Venue'}</div>
                          <div>🕒 {ev.start_time || '10:00 AM'} - {ev.end_time || '01:00 PM'}</div>
                          <div>👥 {ev.event_type} {ev.event_type === 'TEAM' && `(${ev.min_team_size}-${ev.max_team_size} members)`}</div>
                          {ev.rules && (
                            <div style={{ color: isDeactivated ? '#6B7280' : 'var(--gold-light)', fontStyle: 'italic' }}>
                              📜 Rules added ({ev.rules.length} chars)
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', borderTop: isDeactivated ? '1px dashed rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                          onClick={() => handleOpenAssignModal(ev)}
                          className="neu-btn"
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.45rem 0.85rem',
                            opacity: isDeactivated ? 0.5 : 1,
                          }}
                        >
                          Assign Volunteers
                        </button>
                        <button
                          onClick={() => handleOpenEditEvent(ev)}
                          className="neu-btn"
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.45rem 0.85rem',
                            opacity: isDeactivated ? 0.5 : 1,
                          }}
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                        {isDeactivated ? (
                          <button
                            onClick={() => handleToggleEventActive(ev)}
                            className="neu-btn"
                            style={{
                              fontSize: '0.78rem',
                              padding: '0.5rem 1.15rem',
                              background: 'rgba(16, 185, 129, 0.25)',
                              border: '1.5px solid #10B981',
                              color: '#34D399',
                              fontWeight: '800',
                              boxShadow: '0 0 16px rgba(16, 185, 129, 0.45)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              borderRadius: '10px',
                              transform: 'scale(1.02)',
                            }}
                            title="Click to activate this event"
                          >
                            <Eye size={14} color="#34D399" /> Activate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleEventActive(ev)}
                            className="neu-btn"
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.45rem 0.85rem',
                              color: '#EF4444',
                              borderColor: 'rgba(239, 68, 68, 0.4)',
                              background: 'rgba(239, 68, 68, 0.08)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                            title="Click to deactivate this event"
                          >
                            <EyeOff size={14} /> Deactivate
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
        {/* 5. SECTION: ANALYTICS & REVENUE (Admin Only)             */}
        {/* ======================================================== */}
        {activeSection === 'stats' && isAdmin && (() => {
          const rawEvents = stats?.event_stats || [];
          const totalRev = parseFloat(stats?.total_revenue || 0);
          const onlineRev = parseFloat(stats?.online_revenue || 0);
          const offlineRev = parseFloat(stats?.offline_revenue || 0);
          const totalConf = stats?.total_confirmed_registrations || 0;
          const totalParts = stats?.total_participants || 0;
          const totalAtt = stats?.total_checked_in || 0;
          const attRate = stats?.overall_attendance_rate !== undefined
            ? stats.overall_attendance_rate
            : (totalConf > 0 ? Math.round((totalAtt / totalConf) * 100) : 0);

          const onlinePct = totalRev > 0 ? Math.round((onlineRev / totalRev) * 100) : (stats?.online_registrations_count > 0 ? 100 : 0);
          const offlinePct = totalRev > 0 ? Math.round((offlineRev / totalRev) * 100) : 0;

          const soloCount = stats?.solo_registrations_count || 0;
          const teamCount = stats?.team_registrations_count || 0;
          const soloPct = totalConf > 0 ? Math.round((soloCount / totalConf) * 100) : 0;
          const teamPct = totalConf > 0 ? Math.round((teamCount / totalConf) * 100) : 0;

          const avgPerReg = totalConf > 0 ? Math.round(totalRev / totalConf) : 0;

          // Top revenue event
          const topEvent = rawEvents.slice().sort((a, b) => parseFloat(b.total_revenue || 0) - parseFloat(a.total_revenue || 0))[0];

          // Filter and sort event stats list
          const displayedEvents = rawEvents.filter((ev) => {
            const matchesSearch = !analyticsSearch.trim() ||
              ev.event_title.toLowerCase().includes(analyticsSearch.toLowerCase());
            if (!matchesSearch) return false;

            if (analyticsFilterType === 'TEAM') return ev.event_type === 'TEAM';
            if (analyticsFilterType === 'INDIVIDUAL') return ev.event_type === 'INDIVIDUAL';
            if (analyticsFilterType === 'WITH_REGS') return (ev.confirmed_paid_registrations || 0) > 0;
            return true;
          });

          displayedEvents.sort((a, b) => {
            if (analyticsSortBy === 'revenue_desc') {
              return parseFloat(b.total_revenue || 0) - parseFloat(a.total_revenue || 0);
            }
            if (analyticsSortBy === 'regs_desc') {
              return (b.confirmed_paid_registrations || 0) - (a.confirmed_paid_registrations || 0);
            }
            if (analyticsSortBy === 'turnout_desc') {
              return (b.attendance_rate || 0) - (a.attendance_rate || 0);
            }
            if (analyticsSortBy === 'title_asc') {
              return a.event_title.localeCompare(b.event_title);
            }
            return 0;
          });

          // Prepare data for interactive graphs
          const chartData = rawEvents.map((ev) => {
            const rev = parseFloat(ev.total_revenue || 0);
            const onRev = parseFloat(ev.online_revenue || 0);
            const offRev = parseFloat(ev.offline_revenue || 0);
            const shortTitle = ev.event_title.length > 13 ? ev.event_title.slice(0, 11) + '…' : ev.event_title;
            return {
              eventId: ev.event_id,
              name: shortTitle,
              fullTitle: ev.event_title,
              eventType: ev.event_type,
              revenue: rev,
              onlineRevenue: onRev,
              offlineRevenue: offRev,
              registrations: ev.confirmed_paid_registrations || 0,
              headcount: ev.total_participants_count || 0,
              attendanceRate: ev.attendance_rate || 0,
            };
          });

          // Filter events with revenue > 0 for donut chart (or all if 0)
          const pieData = chartData.filter((d) => d.revenue > 0);
          const pieColors = ['#D4AF37', '#60A5FA', '#34D399', '#A78BFA', '#F59E0B', '#EC4899', '#14B8A6', '#F43F5E', '#8B5CF6'];

          const CustomChartTooltip = ({ active, payload, label }) => {
            if (active && payload && payload.length) {
              const item = payload[0].payload;
              return (
                <div style={{
                  background: '#0B0F17',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  borderRadius: '12px',
                  padding: '0.75rem 1rem',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.85)',
                  backdropFilter: 'blur(10px)',
                  zIndex: 100,
                }}>
                  <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#FFF', marginBottom: '0.35rem' }}>
                    {item.fullTitle || label}
                  </div>
                  {payload.map((entry, index) => (
                    <div key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.25rem', fontSize: '0.78rem', marginTop: '0.2rem' }}>
                      <span style={{ color: entry.color || 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color }} />
                        {entry.name}:
                      </span>
                      <span className="font-mono" style={{ fontWeight: '700', color: '#FFF' }}>
                        {entry.dataKey === 'revenue' || entry.dataKey === 'onlineRevenue' || entry.dataKey === 'offlineRevenue'
                          ? `₹${Number(entry.value).toLocaleString('en-IN')}`
                          : entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              );
            }
            return null;
          };

          return (
            <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
              {/* Header & Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.25rem' }}>
                <div>
                  <h1 className="font-display gold-text-glow" style={{ fontSize: '2.2rem', fontWeight: '800', margin: '0 0 0.35rem 0' }}>
                    Analytics & Financial Insights
                  </h1>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, maxWidth: '650px' }}>
                    Real-time monitoring of registrations, gross revenues, gate check-in turnout, and institutional participation.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {/* Refresh Button */}
                  <button
                    type="button"
                    disabled={statsLoading}
                    onClick={() => fetchStats(true)}
                    style={{
                      background: 'rgba(212, 175, 55, 0.1)',
                      border: '1px solid rgba(212, 175, 55, 0.35)',
                      color: 'var(--gold-bright)',
                      padding: '0.65rem 1.1rem',
                      borderRadius: '12px',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      cursor: statsLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!statsLoading) {
                        e.currentTarget.style.background = 'rgba(212, 175, 55, 0.2)';
                        e.currentTarget.style.borderColor = 'var(--gold-bright)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!statsLoading) {
                        e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.35)';
                      }
                    }}
                    title="Refresh analytics from database"
                  >
                    <RotateCw size={16} className={statsLoading ? 'spin-icon' : ''} style={{ animation: statsLoading ? 'spin 1s linear infinite' : 'none' }} />
                    <span>{statsLoading ? 'Refreshing...' : 'Refresh'}</span>
                  </button>

                  {/* Master Fest Excel Export */}
                  <button
                    type="button"
                    disabled={exportingExcel}
                    onClick={() => handleExportFilteredParticipantsExcel()}
                    style={{
                      background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.16) 0%, rgba(170, 124, 17, 0.28) 100%)',
                      border: '1.5px solid rgba(212, 175, 55, 0.5)',
                      color: 'var(--gold-bright)',
                      padding: '0.65rem 1.25rem',
                      borderRadius: '12px',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      cursor: exportingExcel ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.55rem',
                      opacity: exportingExcel ? 0.6 : 1,
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!exportingExcel) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%)';
                        e.currentTarget.style.color = '#000';
                        e.currentTarget.style.boxShadow = '0 0 18px rgba(212, 175, 55, 0.45)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!exportingExcel) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212, 175, 55, 0.16) 0%, rgba(170, 124, 17, 0.28) 100%)';
                        e.currentTarget.style.color = 'var(--gold-bright)';
                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.35)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                    title="Download Master Fest report with all events and separate teammate rows (.xlsx)"
                  >
                    <FileSpreadsheet size={17} />
                    <span>{exportingExcel ? 'Exporting...' : 'Export Master Fest Excel (.xlsx)'}</span>
                  </button>
                </div>
              </div>

              {/* Top 6 Executive Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                {/* Card 1: Gross Revenue */}
                <div style={{ background: 'var(--bg-card)', padding: '1.35rem', borderRadius: '18px', border: '1px solid rgba(212, 175, 55, 0.3)', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.06em' }}>
                      Gross Revenue
                    </div>
                    <DollarSign size={17} color="#D4AF37" />
                  </div>
                  <div className="font-mono" style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--gold-bright)', marginTop: '0.35rem' }}>
                    ₹{totalRev.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                  {/* Mini dual progress bar */}
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden', display: 'flex', margin: '0.65rem 0 0.5rem 0' }}>
                    <div style={{ width: `${onlinePct}%`, background: '#60A5FA' }} title={`Online: ${onlinePct}%`} />
                    <div style={{ width: `${offlinePct}%`, background: '#34D399' }} title={`Offline Cash: ${offlinePct}%`} />
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#60A5FA' }}>₹{onlineRev.toFixed(0)} PG ({onlinePct}%)</span>
                    <span style={{ color: '#34D399' }}>₹{offlineRev.toFixed(0)} Cash</span>
                  </div>
                </div>

                {/* Card 2: Confirmed Registrations */}
                <div style={{ background: 'var(--bg-card)', padding: '1.35rem', borderRadius: '18px', border: '1px solid rgba(212, 175, 55, 0.25)', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.06em' }}>
                      Paid Registrations
                    </div>
                    <CreditCard size={17} color="#F5D77F" />
                  </div>
                  <div className="font-mono" style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--text-white)', marginTop: '0.35rem' }}>
                    {totalConf}
                  </div>
                  {/* Solo vs Team mini bar */}
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden', display: 'flex', margin: '0.65rem 0 0.5rem 0' }}>
                    <div style={{ width: `${soloPct}%`, background: '#D4AF37' }} title={`Solo: ${soloPct}%`} />
                    <div style={{ width: `${teamPct}%`, background: '#A78BFA' }} title={`Teams: ${teamPct}%`} />
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gold-bright)' }}>{soloCount} Solo ({soloPct}%)</span>
                    <span style={{ color: '#A78BFA' }}>{teamCount} Teams</span>
                  </div>
                </div>

                {/* Card 3: Verified Headcount (All participants) */}
                <div style={{ background: 'var(--bg-card)', padding: '1.35rem', borderRadius: '18px', border: '1px solid rgba(212, 175, 55, 0.25)', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.06em' }}>
                      Total Headcount
                    </div>
                    <Users size={17} color="#A78BFA" />
                  </div>
                  <div className="font-mono" style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--text-white)', marginTop: '0.35rem' }}>
                    {totalParts}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ color: 'var(--gold-bright)', fontWeight: '700' }}>{totalParts - totalConf}</span> teammates in squad entries
                  </div>
                </div>

                {/* Card 4: Hall Check-In Turnout */}
                <div style={{ background: 'var(--bg-card)', padding: '1.35rem', borderRadius: '18px', border: '1px solid rgba(212, 175, 55, 0.25)', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.06em' }}>
                      Gate Turnout
                    </div>
                    <CheckCircle size={17} color="#D4AF37" />
                  </div>
                  <div className="font-mono" style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--text-white)', marginTop: '0.35rem' }}>
                    {totalAtt} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: '500' }}>/ {totalConf}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden', margin: '0.65rem 0 0.5rem 0' }}>
                    <div style={{ width: `${Math.min(100, attRate)}%`, height: '100%', background: 'linear-gradient(90deg, #B8860B, #D4AF37)' }} />
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--gold-bright)', fontWeight: '700' }}>
                    {attRate}% Attendance Rate
                  </div>
                </div>

                {/* Card 5: Top Flagship Event */}
                <div style={{ background: 'var(--bg-card)', padding: '1.35rem', borderRadius: '18px', border: '1px solid rgba(212, 175, 55, 0.25)', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.06em' }}>
                      Top Event
                    </div>
                    <Award size={17} color="#D4AF37" />
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-white)', marginTop: '0.45rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={topEvent?.event_title || 'No data'}>
                    {topEvent ? topEvent.event_title : 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gold-bright)', marginTop: '0.5rem', fontWeight: '700' }}>
                    {topEvent ? `₹${parseFloat(topEvent.total_revenue || 0).toFixed(0)} (${topEvent.confirmed_paid_registrations || 0} regs)` : 'No registrations yet'}
                  </div>
                </div>
              </div>

              {/* SVG Gradients for Charts */}
              <svg style={{ height: 0, width: 0, position: 'absolute', pointerEvents: 'none' }}>
                <defs>
                  <linearGradient id="goldBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F5D77F" stopOpacity={1} />
                    <stop offset="100%" stopColor="#AA7C11" stopOpacity={0.9} />
                  </linearGradient>
                  <linearGradient id="blueBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#93C5FD" stopOpacity={1} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0.9} />
                  </linearGradient>
                  <linearGradient id="greenBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6EE7B7" stopOpacity={1} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.9} />
                  </linearGradient>
                </defs>
              </svg>

              {/* Visual Graphs Section */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Graph 1: Event Revenue & Volume Comparison Bar Chart */}
                <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '18px', border: '1px solid rgba(212, 175, 55, 0.25)', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <BarChart3 size={18} color="#D4AF37" />
                      <div>
                        <h3 className="font-display gold-text" style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0 }}>
                          Event Financial Comparison
                        </h3>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Interactive comparison of financial earnings across all events
                        </div>
                      </div>
                    </div>

                    {/* Mode Toggles */}
                    <div style={{ display: 'flex', background: 'var(--bg-inset)', borderRadius: '10px', padding: '3px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      {[
                        { id: 'revenue', label: 'Revenue (₹)' },
                        { id: 'channels', label: 'PG vs Cash' },
                        { id: 'registrations', label: 'Registrations' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setChartViewMode(tab.id)}
                          style={{
                            background: chartViewMode === tab.id ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
                            border: chartViewMode === tab.id ? '1px solid var(--gold-bright)' : '1px solid transparent',
                            color: chartViewMode === tab.id ? 'var(--gold-bright)' : 'var(--text-muted)',
                            padding: '0.35rem 0.65rem',
                            borderRadius: '8px',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {chartData.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No events registered in database.
                    </div>
                  ) : (
                    <div style={{ width: '100%', height: 320 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 15, right: 15, left: -10, bottom: 45 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.07)" vertical={false} />
                          <XAxis
                            dataKey="name"
                            stroke="var(--text-muted)"
                            fontSize={11}
                            tickLine={false}
                            interval={0}
                            angle={-25}
                            textAnchor="end"
                            height={50}
                          />
                          <YAxis
                            stroke="var(--text-muted)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => chartViewMode === 'registrations' ? val : '₹' + (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val)}
                          />
                          <RechartsTooltip content={<CustomChartTooltip />} />
                          {chartViewMode === 'revenue' && (
                            <Bar dataKey="revenue" name="Total Revenue" fill="url(#goldBarGrad)" radius={[6, 6, 0, 0]} maxBarSize={48} />
                          )}
                          {chartViewMode === 'channels' && (
                            <>
                              <Bar dataKey="onlineRevenue" name="Online PG" fill="url(#blueBarGrad)" radius={[6, 6, 0, 0]} maxBarSize={28} />
                              <Bar dataKey="offlineRevenue" name="Cash Desk" fill="url(#greenBarGrad)" radius={[6, 6, 0, 0]} maxBarSize={28} />
                            </>
                          )}
                          {chartViewMode === 'registrations' && (
                            <>
                              <Bar dataKey="registrations" name="Paid Registrations" fill="url(#goldBarGrad)" radius={[6, 6, 0, 0]} maxBarSize={28} />
                              <Bar dataKey="headcount" name="Total Participants" fill="url(#blueBarGrad)" radius={[6, 6, 0, 0]} maxBarSize={28} />
                            </>
                          )}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Graph 2: Event Revenue Share Donut Chart */}
                <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '18px', border: '1px solid rgba(212, 175, 55, 0.25)', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <TrendingUp size={18} color="#D4AF37" />
                    <div>
                      <h3 className="font-display gold-text" style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0 }}>
                        Revenue Share by Event
                      </h3>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Proportional revenue contribution across competitions
                      </div>
                    </div>
                  </div>

                  {pieData.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <DollarSign size={32} color="#D4AF37" style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                      <div>No revenue recorded yet</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Graph will populate automatically as registrations are confirmed.
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ position: 'relative', width: '100%', height: 210 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <RePieChart>
                            <Pie
                              data={pieData}
                              dataKey="revenue"
                              nameKey="fullTitle"
                              cx="50%"
                              cy="50%"
                              innerRadius={65}
                              outerRadius={95}
                              paddingAngle={pieData.length > 1 ? 3 : 0}
                              stroke="#0B0F17"
                              strokeWidth={2}
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip content={<CustomChartTooltip />} />
                          </RePieChart>
                        </ResponsiveContainer>

                        {/* Donut Center Display */}
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          textAlign: 'center',
                          pointerEvents: 'none',
                        }}>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700' }}>
                            Fest Gross
                          </div>
                          <div className="font-mono" style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--gold-bright)' }}>
                            ₹{totalRev.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </div>
                        </div>
                      </div>

                      {/* Event Revenue Contribution List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '110px', overflowY: 'auto', marginTop: '0.75rem', paddingRight: '0.25rem' }}>
                        {pieData.map((entry, index) => {
                          const pct = totalRev > 0 ? ((entry.revenue / totalRev) * 100).toFixed(1) : 0;
                          const color = pieColors[index % pieColors.length];
                          return (
                            <div key={entry.eventId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', background: 'var(--bg-inset)', padding: '0.35rem 0.65rem', borderRadius: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                                <span style={{ color: 'var(--text-white)', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={entry.fullTitle}>
                                  {entry.fullTitle}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                <span className="font-mono" style={{ color: 'var(--gold-bright)', fontWeight: '700' }}>
                                  ₹{entry.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                </span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', minWidth: '40px', textAlign: 'right' }}>
                                  ({pct}%)
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Secondary Operational Insights Grid (Payment Channels & Competition Format) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {/* Box 1: Payment Channel Split (Online PG vs Cash Desk) */}
                <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '18px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <CreditCard size={18} color="#D4AF37" />
                    <h3 className="font-display gold-text" style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0 }}>
                      Payment Channels & Revenue Split
                    </h3>
                  </div>

                  {/* Online PG Row */}
                  <div style={{ marginBottom: '1.1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#60A5FA' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-white)' }}>Online Gateway (Cashfree)</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="font-mono" style={{ fontSize: '0.95rem', fontWeight: '800', color: '#60A5FA' }}>₹{onlineRev.toFixed(0)}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>({onlinePct}%)</span>
                      </div>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${onlinePct}%`, height: '100%', background: 'linear-gradient(90deg, #3B82F6, #60A5FA)', borderRadius: '999px', transition: 'width 0.4s ease' }} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {stats?.online_registrations_count || 0} online transactions settled
                    </div>
                  </div>

                  {/* Offline Cash Row */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#34D399' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-white)' }}>Cash Desk (Spot Registrations)</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="font-mono" style={{ fontSize: '0.95rem', fontWeight: '800', color: '#34D399' }}>₹{offlineRev.toFixed(0)}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>({offlinePct}%)</span>
                      </div>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${offlinePct}%`, height: '100%', background: 'linear-gradient(90deg, #10B981, #34D399)', borderRadius: '999px', transition: 'width 0.4s ease' }} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {stats?.offline_registrations_count || 0} cash entries collected by volunteers
                    </div>
                  </div>
                </div>

                {/* Box 2: Competition Format (Solo vs Squad Teams) */}
                <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '18px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <Users size={18} color="#D4AF37" />
                    <h3 className="font-display gold-text" style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0 }}>
                      Competition Format Dynamics
                    </h3>
                  </div>

                  {/* Solo Contests */}
                  <div style={{ marginBottom: '1.1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#D4AF37' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-white)' }}>Solo Individual Battles</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="font-mono" style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--gold-bright)' }}>{soloCount} entries</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>({soloPct}%)</span>
                      </div>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${soloPct}%`, height: '100%', background: 'linear-gradient(90deg, #B8860B, #D4AF37)', borderRadius: '999px', transition: 'width 0.4s ease' }} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      100% individual single participants
                    </div>
                  </div>

                  {/* Squad Team Battles */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#A78BFA' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-white)' }}>Squad Team Challenges</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="font-mono" style={{ fontSize: '0.95rem', fontWeight: '800', color: '#A78BFA' }}>{teamCount} teams</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>({teamPct}%)</span>
                      </div>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${teamPct}%`, height: '100%', background: 'linear-gradient(90deg, #7C3AED, #A78BFA)', borderRadius: '999px', transition: 'width 0.4s ease' }} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {totalParts - soloCount} participants active in squad rosters
                    </div>
                  </div>
                </div>
              </div>



              {/* Event Performance Ledger Table */}
              <div style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid rgba(212, 175, 55, 0.25)', padding: '1.75rem', boxShadow: 'var(--neu-shadow-flat)' }}>
                {/* Ledger Header & Search/Filter Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 className="font-display gold-text" style={{ fontSize: '1.35rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>
                      Event Performance Ledger
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Detailed revenue breakdown, headcount, and door turnout metrics for every event.
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {/* Search box */}
                    <div style={{ position: 'relative', width: '220px' }}>
                      <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold-bright)', opacity: 0.8 }} />
                      <input
                        type="text"
                        placeholder="Search events..."
                        value={analyticsSearch}
                        onChange={(e) => setAnalyticsSearch(e.target.value)}
                        className="neu-input"
                        style={{ paddingLeft: '2.2rem', paddingRight: '0.75rem', height: '38px', fontSize: '0.82rem', width: '100%' }}
                      />
                    </div>

                    {/* Filter by Category */}
                    <div style={{ display: 'flex', background: 'var(--bg-inset)', borderRadius: '10px', padding: '3px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      {[
                        { id: 'ALL', label: 'All' },
                        { id: 'INDIVIDUAL', label: 'Solo' },
                        { id: 'TEAM', label: 'Teams' },
                        { id: 'WITH_REGS', label: 'Active Regs' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setAnalyticsFilterType(tab.id)}
                          style={{
                            background: analyticsFilterType === tab.id ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
                            border: analyticsFilterType === tab.id ? '1px solid var(--gold-bright)' : '1px solid transparent',
                            color: analyticsFilterType === tab.id ? 'var(--gold-bright)' : 'var(--text-muted)',
                            padding: '0.35rem 0.65rem',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Sort selector */}
                    <select
                      value={analyticsSortBy}
                      onChange={(e) => setAnalyticsSortBy(e.target.value)}
                      style={{
                        height: '38px',
                        background: 'var(--bg-inset)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        borderRadius: '10px',
                        color: 'var(--text-white)',
                        fontSize: '0.78rem',
                        fontWeight: '600',
                        padding: '0 0.85rem',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="revenue_desc">Sort: Highest Revenue</option>
                      <option value="regs_desc">Sort: Most Registrations</option>
                      <option value="turnout_desc">Sort: Highest Turnout %</option>
                      <option value="title_asc">Sort: Event Name (A-Z)</option>
                    </select>
                  </div>
                </div>

                {/* Table or Empty State */}
                {displayedEvents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'var(--bg-inset)', borderRadius: '14px', border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
                    <AlertCircle size={32} color="#D4AF37" style={{ margin: '0 auto 0.75rem auto' }} />
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-white)' }}>
                      No Matching Events Found
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      Try clearing your search query or choosing another filter category.
                    </div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '780px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.25)', background: 'rgba(212, 175, 55, 0.05)' }}>
                          <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', fontWeight: '800', color: 'var(--gold-bright)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Event Title</th>
                          <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', fontWeight: '800', color: 'var(--gold-bright)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>Type</th>
                          <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', fontWeight: '800', color: 'var(--gold-bright)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>Ticket Fee</th>
                          <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', fontWeight: '800', color: 'var(--gold-bright)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>Registrations</th>
                          <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', fontWeight: '800', color: 'var(--gold-bright)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>Headcount</th>
                          <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', fontWeight: '800', color: 'var(--gold-bright)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>Gate Turnout</th>
                          <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', fontWeight: '800', color: 'var(--gold-bright)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>Gross Revenue</th>
                          <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', fontWeight: '800', color: 'var(--gold-bright)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedEvents.map((ev, idx) => {
                          const fee = parseFloat(ev.registration_fee || 0);
                          const evRev = parseFloat(ev.total_revenue || 0);
                          const evOnlineRev = parseFloat(ev.online_revenue || 0);
                          const evOfflineRev = parseFloat(ev.offline_revenue || 0);
                          const evAttRate = ev.attendance_rate || 0;
                          const isTeam = ev.event_type === 'TEAM';

                          return (
                            <tr
                              key={ev.event_id}
                              style={{
                                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                                transition: 'background 0.15s ease',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(212, 175, 55, 0.05)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)')}
                            >
                              {/* Title & Status */}
                              <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                                <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--text-white)' }}>
                                  {ev.event_title}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ color: ev.is_active ? '#34D399' : '#F87171' }}>
                                    ● {ev.is_active ? 'ACTIVE' : 'INACTIVE'}
                                  </span>
                                  <span>•</span>
                                  <span>Cap: {ev.max_capacity || 100}</span>
                                </div>
                              </td>

                              {/* Event Type */}
                              <td style={{ padding: '1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '0.2rem 0.55rem',
                                    borderRadius: '6px',
                                    fontSize: '0.72rem',
                                    fontWeight: '800',
                                    background: isTeam ? 'rgba(167, 139, 250, 0.15)' : 'rgba(212, 175, 55, 0.15)',
                                    border: isTeam ? '1px solid rgba(167, 139, 250, 0.4)' : '1px solid rgba(212, 175, 55, 0.4)',
                                    color: isTeam ? '#C4B5FD' : 'var(--gold-bright)',
                                  }}
                                >
                                  {isTeam ? 'TEAM' : 'SOLO'}
                                </span>
                              </td>

                              {/* Ticket Fee */}
                              <td style={{ padding: '1rem', verticalAlign: 'middle', textAlign: 'right' }}>
                                <div className="font-mono" style={{ fontSize: '0.88rem', fontWeight: '700', color: fee > 0 ? 'var(--text-white)' : '#34D399' }}>
                                  {fee > 0 ? `₹${fee.toFixed(0)}` : 'FREE'}
                                </div>
                              </td>

                              {/* Confirmed Registrations */}
                              <td style={{ padding: '1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                                <div className="font-mono" style={{ fontSize: '0.95rem', fontWeight: '800', color: ev.confirmed_paid_registrations > 0 ? 'var(--gold-bright)' : 'var(--text-muted)' }}>
                                  {ev.confirmed_paid_registrations || 0}
                                </div>
                              </td>

                              {/* Headcount */}
                              <td style={{ padding: '1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                                <div className="font-mono" style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-white)' }}>
                                  {ev.total_participants_count || 0}
                                </div>
                              </td>

                              {/* Turnout Attendance Progress */}
                              <td style={{ padding: '1rem', verticalAlign: 'middle', textAlign: 'center', minWidth: '130px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
                                  <span className="font-mono" style={{ fontSize: '0.8rem', fontWeight: '700', color: evAttRate > 0 ? '#34D399' : 'var(--text-muted)' }}>
                                    {ev.total_attended_count || 0} / {ev.confirmed_paid_registrations || 0}
                                  </span>
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                    ({evAttRate}%)
                                  </span>
                                </div>
                                <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                                  <div style={{ width: `${Math.min(100, evAttRate)}%`, height: '100%', background: evAttRate > 0 ? '#34D399' : 'transparent', borderRadius: '999px' }} />
                                </div>
                              </td>

                              {/* Gross Revenue */}
                              <td style={{ padding: '1rem', verticalAlign: 'middle', textAlign: 'right' }}>
                                <div className="font-mono" style={{ fontSize: '1.05rem', fontWeight: '800', color: evRev > 0 ? 'var(--gold-bright)' : 'var(--text-muted)' }}>
                                  ₹{evRev.toFixed(0)}
                                </div>
                                {(evOnlineRev > 0 || evOfflineRev > 0) && (
                                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                    {evOnlineRev > 0 && <span style={{ color: '#60A5FA' }}>₹{evOnlineRev.toFixed(0)} PG </span>}
                                    {evOfflineRev > 0 && <span style={{ color: '#34D399' }}>₹{evOfflineRev.toFixed(0)} Cash</span>}
                                  </div>
                                )}
                              </td>

                              {/* Action: Export Roster */}
                              <td style={{ padding: '1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  disabled={exportingExcel}
                                  onClick={() => handleExportEventRosterExcel(ev.event_id, ev.event_title)}
                                  style={{
                                    background: 'rgba(212, 175, 55, 0.1)',
                                    border: '1px solid rgba(212, 175, 55, 0.35)',
                                    color: 'var(--gold-bright)',
                                    padding: '0.4rem 0.75rem',
                                    borderRadius: '8px',
                                    cursor: exportingExcel ? 'not-allowed' : 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    fontSize: '0.74rem',
                                    fontWeight: '700',
                                    transition: 'all 0.15s ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!exportingExcel) {
                                      e.currentTarget.style.background = 'linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%)';
                                      e.currentTarget.style.color = '#000';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!exportingExcel) {
                                      e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)';
                                      e.currentTarget.style.color = 'var(--gold-bright)';
                                    }
                                  }}
                                  title={`Download roster for ${ev.event_title} (.xlsx)`}
                                >
                                  <FileSpreadsheet size={14} />
                                  <span>Export</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      {/* Summary Footer Row */}
                      <tfoot>
                        <tr style={{ borderTop: '2px solid rgba(212, 175, 55, 0.35)', background: 'rgba(212, 175, 55, 0.08)' }}>
                          <td style={{ padding: '1rem', fontWeight: '800', fontSize: '0.85rem', color: 'var(--gold-bright)', textTransform: 'uppercase' }}>
                            Grand Totals ({displayedEvents.length} Events)
                          </td>
                          <td style={{ padding: '1rem' }} />
                          <td style={{ padding: '1rem' }} />
                          <td style={{ padding: '1rem', textAlign: 'center' }} className="font-mono">
                            <span style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--gold-bright)' }}>
                              {displayedEvents.reduce((acc, curr) => acc + (curr.confirmed_paid_registrations || 0), 0)}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }} className="font-mono">
                            <span style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--text-white)' }}>
                              {displayedEvents.reduce((acc, curr) => acc + (curr.total_participants_count || 0), 0)}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }} className="font-mono">
                            <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#34D399' }}>
                              {displayedEvents.reduce((acc, curr) => acc + (curr.total_attended_count || 0), 0)}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right' }} className="font-mono">
                            <span style={{ fontWeight: '800', fontSize: '1.15rem', color: 'var(--gold-bright)' }}>
                              ₹{displayedEvents.reduce((acc, curr) => acc + parseFloat(curr.total_revenue || 0), 0).toFixed(0)}
                            </span>
                          </td>
                          <td style={{ padding: '1rem' }} />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

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
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    placeholder="10-digit phone"
                    value={newVolForm.phone}
                    onChange={(e) => setNewVolForm({ ...newVolForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
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

            {/* Admin Credentials Form Card */}
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: '20px',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                padding: '2rem',
                boxShadow: 'var(--neu-shadow-flat)',
                marginTop: '2rem',
              }}
            >
              <div style={{ marginBottom: '1.5rem' }}>
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    color: 'var(--gold-bright)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                  }}
                >
                  Security & Authentication
                </div>
                <h2
                  className="font-display gold-text-glow"
                  style={{ fontSize: '1.4rem', fontWeight: '800', marginTop: '0.2rem' }}
                >
                  Change Admin Credentials
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Update your administrative login username and password.
                </p>
              </div>

              <form
                onSubmit={handleChangeAdminCredentials}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
              >
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                    Admin Username
                  </label>
                  <input
                    type="text"
                    value={adminCredForm.username}
                    onChange={(e) => setAdminCredForm({ ...adminCredForm, username: e.target.value })}
                    placeholder="admin"
                    className="neu-input"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      New Password
                    </label>
                    <input
                      type="password"
                      value={adminCredForm.newPassword}
                      onChange={(e) => setAdminCredForm({ ...adminCredForm, newPassword: e.target.value })}
                      placeholder="Leave blank to keep unchanged"
                      className="neu-input"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={adminCredForm.confirmPassword}
                      onChange={(e) => setAdminCredForm({ ...adminCredForm, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                      className="neu-input"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                    Current Password (required when changing password)
                  </label>
                  <input
                    type="password"
                    value={adminCredForm.currentPassword}
                    onChange={(e) => setAdminCredForm({ ...adminCredForm, currentPassword: e.target.value })}
                    placeholder="••••••••"
                    className="neu-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={credUpdating}
                  className="neu-btn-gold"
                  style={{ marginTop: '0.5rem', padding: '0.85rem' }}
                >
                  {credUpdating ? 'Updating Credentials...' : 'Update Admin Credentials'}
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
            className="responsive-modal-overlay"
            onClick={() => setCreateEventModal(false)}
          >
            <div
              className="responsive-modal-card"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '620px',
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
            className="responsive-modal-overlay"
            onClick={() => setAssignModalOpen(false)}
          >
            <div
              className="responsive-modal-card"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '460px',
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
            className="responsive-modal-overlay"
            onClick={() => setInspectRegistration(null)}
          >
            <div
              className="responsive-modal-card"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '540px',
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
                      background:
                        inspectRegistration.payment_status === 'SUCCESS'
                          ? (inspectRegistration.payment_mode === 'OFFLINE' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(16, 185, 129, 0.15)')
                          : inspectRegistration.payment_status === 'PENDING'
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(239, 68, 68, 0.15)',
                      color:
                        inspectRegistration.payment_status === 'SUCCESS'
                          ? (inspectRegistration.payment_mode === 'OFFLINE' ? 'var(--gold-bright)' : '#10B981')
                          : inspectRegistration.payment_status === 'PENDING'
                            ? '#F59E0B'
                            : '#EF4444',
                      border:
                        inspectRegistration.payment_status === 'SUCCESS'
                          ? (inspectRegistration.payment_mode === 'OFFLINE' ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)')
                          : inspectRegistration.payment_status === 'PENDING'
                            ? '1px solid rgba(245, 158, 11, 0.35)'
                            : '1px solid rgba(239, 68, 68, 0.35)',
                      fontWeight: '700',
                    }}
                  >
                    {inspectRegistration.payment_status === 'SUCCESS'
                      ? (inspectRegistration.payment_mode === 'OFFLINE' ? '✓ Cash Payment (Confirmed)' : '✓ Online Gateway (Confirmed)')
                      : inspectRegistration.payment_status === 'PENDING'
                        ? '⏳ Payment Pending'
                        : '✕ Payment Failed'}
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
    </>
  );
}
