import React, { lazy, Suspense, useState, useEffect, useMemo, useRef } from 'react';
import { Box, Select, MenuItem } from '@mui/material';
import { dashboardService } from '../../services/dashboardService';
import { trainingService } from '../../services/trainingService';
import { Users, BookOpen, MapPin, Table, User, House, SlidersHorizontal } from 'lucide-react';
const TraineeLocationMap = lazy(() => import('./TraineeLocationMap'));


// --- THEME CONFIGURATION ---
const THEME = {
  gap: { xs: '8px', sm: '12px', md: '16px', lg: '24px', xl: '32px' },
  pad: { s: '2', sm: '12px', md: '16px', lg: '20px', xl: '28px' },
  bgGradient: 'linear-gradient(to bottom, #f8fafc, #f1f5f9)',
  glass: {
    background: 'rgba(255, 255, 255, 0.85)',
    border: '1px solid rgba(255, 255, 255, 0.9)',
    borderRadius: '16px',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    transition: 'all 0.3s ease'
  },
  primary: '#4f46e5',
  secondary: '#db2777',
  success: '#059669',
  warning: '#d97706',
  danger: '#dc2626',
  gradients: {
    primary: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    success: 'linear-gradient(135deg, #0f766e 0%, #0f172a 120%)',
    warning: 'linear-gradient(135deg, #b45309 0%, #1f2937 120%)',
    secondary: 'linear-gradient(135deg, #334155 0%, #111827 100%)',
    cyan: 'linear-gradient(135deg, #0e7490 0%, #0f172a 120%)',
    kpiA: 'linear-gradient(135deg, #7b3f99 0%, #5a2b7a 100%)',
    kpiB: 'linear-gradient(135deg, #9b59b6 0%, #7b3f99 100%)',
    kpiC: 'linear-gradient(135deg, #6a0dad 0%, #4c1d95 100%)',
    kpiD: 'linear-gradient(135deg, #b06ad9 0%, #7b3f99 100%)'
  },
  input: {
    padding: '10px 16px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '0.9rem',
    fontWeight: '500', color: '#1e293b', background: '#ffffff', outline: 'none', cursor: 'pointer',
    transition: 'all 0.2s ease', height: '42px', display: 'flex', alignItems: 'center'
  }
};

// --- TRAINING PHASE COLOR PALETTE ---

const TRAINING_TYPE_COLORS = {
  '': '#16a34a',                   // Default (All Training Types)

  // Pilot Phase: distinct, non-repeating colors
  'Pilot Phase': '#2563eb',
  'Pilot Phase I': '#2563eb',
  'Pilot Phase II': '#f59e0b',
  'Pilot Phase III': '#10b981',

  // Educator Phase: rich, distinct, non-repeating colors
  'Educator Phase': '#C4B5FD',

  'Educator Phase I': '#F472B6',   // Refined Rose
  'Educator Phase II': '#FB923C',  // Refined Peach
  'Educator Phase III': '#818CF8', // Refined Indigo
  'Educator Phase IV': '#22D3EE',  // Refined Cyan
};

const getTrainingTypeColor = (trainingType) =>
  TRAINING_TYPE_COLORS[trainingType] || TRAINING_TYPE_COLORS[''];

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [trainingLocations, setTrainingLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [filters, setFilters] = useState({
    district_cd: '', block_cd: '', village: '', start_date: '', end_date: '', subject: '', status: '', training_type: ''
  });
  const [expandedTrainingType, setExpandedTrainingType] = useState('');
  const [isTrainingTypeMenuOpen, setIsTrainingTypeMenuOpen] = useState(false);
  const keepTrainingTypeMenuOpen = useRef(false);


  //dashboard data fetch on filter change

  const dashboardFilters = useMemo(() => ({
    district_cd: filters.district_cd,
    block_cd: filters.block_cd,
    village: filters.village,
    subject: filters.subject,
    training_type: filters.training_type,
    start_date: filters.start_date,
    end_date: filters.end_date,
    status: filters.status,
  }), [filters.district_cd, filters.block_cd, filters.village, filters.subject,
    filters.training_type, filters.start_date, filters.end_date, filters.status]);

  useEffect(() => {
    let isCurrentRequest = true;
    Promise.resolve().then(() => {
      if (!isCurrentRequest) return null;
      setLoading(true);
      setError(null);
      return Promise.all([
      dashboardService.getDashboardData(dashboardFilters),
      dashboardService.getDashboardViewData(dashboardFilters),
    ]);
    }).then((result) => {
        if (!result) return;
        const [summaryData, viewDataResult] = result;
        if (!isCurrentRequest) return;
        setData(summaryData);
        setViewData(viewDataResult);
      })
      .catch((requestError) => {
        if (!isCurrentRequest) return;
        console.error('Dashboard fetch failed:', requestError);
        setError(requestError.message || 'Failed to load dashboard data');
      })
      .finally(() => {
        if (isCurrentRequest) setLoading(false);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [dashboardFilters]);

  useEffect(() => {
    const fetchDistricts = async () => { try { const data = await dashboardService.getDistricts(); setDistricts(Array.isArray(data) ? data : []); } catch (error) { console.error('Error loading districts', error); } };
    fetchDistricts();
  }, []);

  useEffect(() => {
    if (!filters.district_cd) return;
    let isCurrentRequest = true;
    const fetchBlocks = async () => {
      try {
        const data = await dashboardService.getBlocksByDistrict(filters.district_cd);
        if (isCurrentRequest) setBlocks(Array.isArray(data) ? data : []);
      } catch (error) { console.error('Error loading blocks', error); }
    };
    fetchBlocks();
    return () => { isCurrentRequest = false; };
  }, [filters.district_cd]);

  useEffect(() => {
    const fetchTrainingsForMap = async () => {
      try {
        const trainings = await trainingService.getAll({ limit: 1000 });
        const trainingData = Array.isArray(trainings) ? trainings : trainings?.data || [];
        setTrainingLocations(trainingData);
      } catch (error) { console.error("Error fetching trainings for map:", error); }
    };
    fetchTrainingsForMap();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'district_cd') setBlocks([]);
    setFilters(prev => ({ ...prev, [name]: value, ...(name === 'district_cd' ? { block_cd: '' } : {}) }));
  };

  const handleTrainingTypeGroupClick = (trainingType) => {
    keepTrainingTypeMenuOpen.current = true;
    setFilters(prev => ({ ...prev, training_type: trainingType }));
    setExpandedTrainingType(prev => prev === trainingType ? '' : trainingType);
    setIsTrainingTypeMenuOpen(true);
  };

  const handleTrainingTypeMenuClose = () => {
    if (keepTrainingTypeMenuOpen.current) {
      keepTrainingTypeMenuOpen.current = false;
      return;
    }
    setIsTrainingTypeMenuOpen(false);
  };

  const filteredTrainingLocations = useMemo(() => {
    if (!trainingLocations.length) return [];
    const selectedDistrictObj = districts.find(d => String(d.district_cd) === String(filters.district_cd));
    const selectedDistrictName = selectedDistrictObj?.district_name?.toLowerCase();
    const selectedBlockObj = blocks.find(b => String(b.block_cd) === String(filters.block_cd));
    const selectedBlockName = selectedBlockObj?.block_name?.toLowerCase();

    return trainingLocations.filter(training => {
      const loc = training.location_details || {};
      const matchDistrict = !filters.district_cd || (
        loc.district_cd != null
          ? String(loc.district_cd) === String(filters.district_cd)
          : loc.district?.toLowerCase() === selectedDistrictName
      );
      const matchBlock = !filters.block_cd || (
        loc.block_cd != null
          ? String(loc.block_cd) === String(filters.block_cd)
          : loc.block?.toLowerCase() === selectedBlockName
      );
      const matchStatus = !filters.status || training.status?.toLowerCase() === filters.status.toLowerCase();
      const matchSubject = !filters.subject || (training.subject_name?.toLowerCase() === filters.subject.toLowerCase() || training.subject?.toLowerCase() === filters.subject.toLowerCase());
      const trainingType = training.training_type?.toLowerCase() || '';
      const matchTrainingType = !filters.training_type || trainingType.startsWith(filters.training_type.toLowerCase());
      let matchDate = true;
      const trainingDate = new Date(training.start_date);
      if (filters.start_date && training.start_date) { if (trainingDate < new Date(filters.start_date)) matchDate = false; }
      if (filters.end_date && training.start_date) { if (trainingDate > new Date(filters.end_date)) matchDate = false; }
      return matchDistrict && matchBlock && matchStatus && matchTrainingType && matchDate && matchSubject;
    });
  }, [trainingLocations, filters, districts, blocks]);

  // NEW: resolve the active marker color from the currently selected training type
  const activeMarkerColor = useMemo(
    () => getTrainingTypeColor(filters.training_type),
    [filters.training_type]
  );

  if (loading) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: THEME.bgGradient, color: THEME.primary, fontSize: '1rem', fontWeight: '600' }}>Loading Dashboard Data...</div>;
  if (error) return <div style={{ padding: THEME.pad.xl, color: THEME.danger, textAlign: 'center' }}>Error: {error}</div>;
  if (!data) return <div style={{ padding: THEME.pad.xl, color: '#64748b', textAlign: 'center' }}>No Data Available</div>;

  const selectSx = {
    minWidth: 210,
    height: '42px',
    background: '#ffffff',
    borderRadius: '12px',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#1e293b',
    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
    '& .MuiOutlinedInput-notchedOutline': {
      border: '1px solid #cbd5e1',
      borderRadius: '12px',
      transition: 'all 0.2s ease-in-out'
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#6366f1 !important',
      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.08)'
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#4f46e5 !important',
      borderWidth: '1.5px',
      boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.12) !important'
    },
    '& .MuiSelect-select': {
      padding: '9px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#0f172a'
    }
  };

  return (
    <div style={{ padding: '10px 15px 15px 15px', display: 'flex', flexDirection: 'column', gap: THEME.gap.xs, minHeight: '100vh', background: THEME.bgGradient, overflowX: "hidden" }}>
      <Box sx={{ textAlign: 'center', mb: 0.5, opacity: 0, animation: 'fadeIn 0.8s ease-out forwards' }}>
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', px: 1, mb: 1 }}>
        <div
          style={{
            ...THEME.glass,
            width: '100%',
            maxWidth: '1500px',
            padding: '12px 24px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: THEME.gap.sm,
            margin: '0 auto',
            borderRadius: '18px',
            boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(226, 232, 240, 0.9)'
          }}
        >
          {/* Left Title & Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)'
              }}
            >
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.925rem', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Dashboard Controls
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>
                Filter trainings & map view by district or type
              </div>
            </div>
          </div>

          {/* Filter Dropdowns */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* District Filter */}
            <Select
              name="district_cd"
              value={filters.district_cd}
              onChange={handleFilterChange}
              displayEmpty
              size="small"
              sx={selectSx}
              renderValue={(selected) => {
                if (!selected) {
                  return (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                      <MapPin size={16} color="#5356edff" />
                      <span>All Districts</span>
                    </span>
                  );
                }
                const dist = districts.find(d => String(d.district_cd) === String(selected));
                return (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: 600 }}>
                    <MapPin size={16} color="#4f46e5" />
                    <span>{dist?.district_name || 'District'}</span>
                  </span>
                );
              }}
            >
              <MenuItem value="">
                <span style={{ fontWeight: 500, color: '#64748b' }}>All Districts</span>
              </MenuItem>
              {districts.map((d) => (
                <MenuItem key={d.district_cd} value={d.district_cd} sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                  {d.district_name}
                </MenuItem>
              ))}
            </Select>

            {/* Training Type Filter */}
            <Select
              name="training_type"
              value={filters.training_type}
              onChange={handleFilterChange}
              open={isTrainingTypeMenuOpen}
              onOpen={() => setIsTrainingTypeMenuOpen(true)}
              onClose={handleTrainingTypeMenuClose}
              displayEmpty
              size="small"
              sx={selectSx}
              renderValue={(selected) => {
                if (!selected) {
                  return (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                      <BookOpen size={16} color="#16a34a" />
                      <span>All Training Types</span>
                    </span>
                  );
                }
                return (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: 600 }}>
                    {/* NEW: small color swatch showing the active phase color */}
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: getTrainingTypeColor(selected),
                        flexShrink: 0
                      }}
                    />
                    <BookOpen size={16} color={getTrainingTypeColor(selected)} />
                    <span>{selected}</span>
                  </span>
                );
              }}
            >
              <MenuItem value="">
                <span style={{ fontWeight: 500, color: '#64748b' }}>All Training Types</span>
              </MenuItem>
              <MenuItem
                value="Pilot Phase"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleTrainingTypeGroupClick('Pilot Phase');
                }}
                sx={{ fontSize: '0.875rem', fontWeight: 600 }}
              >
                Pilot Phase {expandedTrainingType === 'Pilot Phase' ? '▾' : '▸'}
              </MenuItem>
              {expandedTrainingType === 'Pilot Phase' && ['I', 'II', 'III'].map((phase) => (
                <MenuItem key={phase} value={`Pilot Phase ${phase}`} sx={{ pl: 4, fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* NEW: color swatch per phase option */}
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      background: getTrainingTypeColor(`Pilot Phase ${phase}`),
                      flexShrink: 0
                    }}
                  />
                  Pilot Phase {phase}
                </MenuItem>
              ))}
              <MenuItem
                value="Educator Phase"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleTrainingTypeGroupClick('Educator Phase');
                }}
                sx={{ fontSize: '0.875rem', fontWeight: 600 }}
              >
                Educator Phase {expandedTrainingType === 'Educator Phase' ? '▾' : '▸'}
              </MenuItem>
              {expandedTrainingType === 'Educator Phase' && ['I', 'II', 'III', 'IV'].map((phase) => (
                <MenuItem key={phase} value={`Educator Phase ${phase}`} sx={{ pl: 4, fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* NEW: color swatch per phase option */}
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      background: getTrainingTypeColor(`Educator Phase ${phase}`),
                      flexShrink: 0
                    }}
                  />
                  Educator Phase {phase}
                </MenuItem>
              ))}
            </Select>

          </div>
        </div>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 1 }} role="tablist" aria-label="Dashboard views">
        {[['summary', 'Summary'], ['detailed', 'Training Directory']].map(([tab, label]) => (
          <button key={tab} type="button" role="tab" aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, color: activeTab === tab ? '#fff' : '#334155', background: activeTab === tab ? THEME.primary : '#fff' }}>
            {label}
          </button>
        ))}
      </Box>
      {activeTab === 'summary' && (
        <SummaryTab
          summary={data}
          trainingLocations={filteredTrainingLocations}
          focusTarget={null}
          markerColor={activeMarkerColor}
        />
      )}
      {activeTab === 'detailed' && <DetailedTab viewData={viewData} />}
    </div >
  );
};

const SummaryTab = ({ summary, trainingLocations, focusTarget, markerColor }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: THEME.gap.sm }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: THEME.gap.sm }}>
      <StatCard title="Total Trainings" value={summary?.total_trainings || 0} icon={BookOpen} gradient={THEME.gradients.kpiA} />
      <StatCard title="Total Trainers" value={summary?.total_trainers || 0} icon={User} gradient={THEME.gradients.kpiB} />
      <StatCard title="Total Participants" value={summary?.total_participants || 0} icon={Users} gradient={THEME.gradients.kpiC} />
      <StatCard title="Total Locations" value={summary?.total_locations || 0} icon={House} gradient={THEME.gradients.kpiD} />
    </div>
    <div style={{ width: '100%', height: '560px', marginTop: '8px', borderRadius: '20px', overflow: 'hidden' }}>
      <Suspense fallback={<div role="status" style={{ height: '100%', display: 'grid', placeItems: 'center' }}>Loading map?</div>}>
      <TraineeLocationMap
        trainingLocations={trainingLocations}
        focusTarget={focusTarget}
        markerColor={markerColor}
      />
      </Suspense>
    </div>
  </div>
);

const DetailedTab = ({ viewData }) => (
  <div style={{ ...THEME.glass, padding: THEME.pad.xl, minHeight: '500px', background: '#ffffff' }}>
    <div style={{ marginBottom: THEME.pad.lg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: THEME.gap.sm }}><Table size={24} color={THEME.primary} /> Training Directory</h2>
        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>Comprehensive overview of sessions</p>
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: THEME.gap.sm }}>
      {viewData && viewData.data && viewData.data.length > 0 ? (
        viewData.data.map((row, i) => (
          <div key={row.training_id || row.id || i} style={{ display: 'grid', gridTemplateColumns: '80px 2.5fr 1.5fr 100px 120px 160px', gap: THEME.gap.md, alignItems: 'center', padding: `16px 20px`, background: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', transition: 'all 0.15s ease', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)'; e.currentTarget.style.borderColor = '#e5e7eb'; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#f3f4f6'; }}>
            <div><span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: THEME.primary, fontWeight: '700', background: '#eff6ff', padding: `4px 8px`, borderRadius: '6px' }}>#{row.training_id || row.id}</span></div>
            <div><div style={{ fontWeight: '700', color: '#1e293b', marginBottom: '2px', fontSize: '0.95rem' }}>{row.subject_name}</div><div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}><User size={13} /> {row.trainer_name}</div></div>
            <div><div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: '600' }}>{row.village || row.location_details?.village || '-'}</div></div>
            <div><span style={{ padding: `4px 8px`, borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', background: '#e0e7ff', color: '#3730a3' }}>{row.status}</span></div>
          </div>
        ))
      ) : (<div style={{ padding: THEME.pad.xl, textAlign: 'center', color: '#94a3b8', fontSize: '0.95rem' }}>No Training Data Available</div>)}
    </div>
  </div>
);

const StatCard = ({ title, value, icon, gradient }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '200px', padding: '14px 16px', borderRadius: '12px', position: 'relative', backgroundImage: `${gradient}`, backgroundSize: 'cover', border: '1px solid rgba(255, 255, 255, 0.15)', boxShadow: `0 4px 12px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)`, transition: 'transform 220ms cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 220ms ease', cursor: 'default', overflow: 'hidden', userSelect: 'none' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 10px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)`; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 12px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)`; }}>
      <div style={{ position: 'absolute', inset: '0', background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0))', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, zIndex: 1 }}>
        <div style={{ fontSize: '0.7rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.85)', letterSpacing: '0.08em', textTransform: 'uppercase', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>{title}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: '800', lineHeight: '1', letterSpacing: '-0.02em', color: '#ffffff', textShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>{value}</div>
      </div>
      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.2)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 8px rgba(0,0,0,0.1)', zIndex: 1 }}>{React.createElement(icon, { size: 18, color: "#ffffff", strokeWidth: 2.5 })}</div>
    </div>
  );
};

export default Dashboard;
