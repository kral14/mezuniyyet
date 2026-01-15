import React, { useState, useEffect, useRef } from 'react';
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay,
    parseISO
} from 'date-fns';
import { az } from 'date-fns/locale';
import { Box, Paper, Typography, IconButton, Tooltip, Menu, MenuItem, TextField, InputAdornment, Portal } from '@mui/material';
import { ChevronLeft, ChevronRight, Search, FilterList, Close, OpenInFull as ExpandIcon, Close as CloseIcon } from '@mui/icons-material';

const VacationCalendar = ({ vacations = [], employees = [], onVacationClick, currentUser, focusDate, highlightVacationId }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [approvedVacations, setApprovedVacations] = useState([]);

    // Filter & Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDept, setFilterDept] = useState(null);
    const [anchorElFilter, setAnchorElFilter] = useState(null);
    const [showSearch, setShowSearch] = useState(false);

    // Modal Animation State
    const [modalOpen, setModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState(null); // { date: Date, vacations: [] }
    const [sourceRect, setSourceRect] = useState(null);
    const [animState, setAnimState] = useState('closed'); // closed, opening, open, closing

    // Helper to get consistent color
    const stringToColor = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return '#' + '00000'.substring(0, 6 - c.length) + c;
    };

    useEffect(() => {
        const relevant = vacations.filter(v => v.status === 'approved' || v.status === 'pending');
        setApprovedVacations(relevant);
    }, [vacations]);

    const deptMap = React.useMemo(() => {
        const map = {};
        employees.forEach(e => {
            if (e.department) map[e.id] = e.department;
            if (e.id) map[e.id + '_emp'] = e; // Store full emp for lookup
        });
        return map;
    }, [employees]);

    const uniqueDepts = React.useMemo(() => {
        if (!employees.length) return [];
        const depts = new Set(employees.map(e => e.department).filter(Boolean));
        return Array.from(depts);
    }, [employees]);

    const filteredVacations = React.useMemo(() => {
        return approvedVacations.filter(vac => {
            const nameMatch = !searchQuery || (vac.employee_name && vac.employee_name.toLowerCase().includes(searchQuery.toLowerCase()));
            const vacDept = deptMap[vac.employee_id];
            const deptMatch = !filterDept || vacDept === filterDept;
            return nameMatch && deptMatch;
        });
    }, [approvedVacations, searchQuery, filterDept, deptMap]);

    useEffect(() => {
        if (focusDate) {
            const date = parseISO(focusDate);
            if (!isNaN(date)) setCurrentMonth(date);
        }
    }, [focusDate]);

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const getVacationsForDay = (day) => {
        const dayStr = format(day, 'yyyy-MM-dd');
        return filteredVacations.filter(vac => {
            if (!vac.start_date || !vac.end_date) return false;
            try {
                const vStartStr = vac.start_date.split('T')[0];
                const vEndStr = vac.end_date.split('T')[0];
                return dayStr >= vStartStr && dayStr <= vEndStr;
            } catch (e) {
                return false;
            }
        });
    };

    // --- Modal Logic ---
    const handleExpand = (date, dayVacations, event) => {
        event.stopPropagation();
        // Get rect of the parent cell (closest .calendar-cell or event target parent)
        const cell = event.currentTarget.closest('.calendar-cell');
        if (cell) {
            setSourceRect(cell.getBoundingClientRect());
        } else {
            // Fallback to center if something fails
            setSourceRect({ top: window.innerHeight / 2, left: window.innerWidth / 2, width: 0, height: 0 });
        }

        setModalContent({ date, vacations: dayVacations });
        setAnimState('opening');
        setModalOpen(true);

        // Trigger animation to 'open' state in next frame
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setAnimState('open');
            });
        });
    };

    const handleCloseModal = () => {
        if (animState === 'closing') return;
        setAnimState('closing');
        // Wait for animation to finish
        setTimeout(() => {
            setModalOpen(false);
            setAnimState('closed');
            setModalContent(null);
        }, 400); // Match transition duration
    };

    // Calculate Grid Dimensions
    const getGridDims = (count) => {
        if (count === 0) return { cols: 1, rows: 1 };
        const cols = Math.ceil(Math.sqrt(count));
        const rows = Math.ceil(count / cols);
        return { cols, rows };
    };

    const renderHeader = () => (
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} px={1}>
            <Box display="flex" alignItems="center" gap={2} flex={1}>
                <Typography variant="h6" fontWeight="bold" textTransform="capitalize" sx={{ minWidth: 140 }}>
                    {format(currentMonth, 'MMMM yyyy', { locale: az })}
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                    Məzuniyyət Təqvimi
                </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
                <Box display="flex" alignItems="center">
                    <Box sx={{
                        width: showSearch ? 220 : 0, opacity: showSearch ? 1 : 0, transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', overflow: 'hidden', whiteSpace: 'nowrap', mr: showSearch ? 1 : 0
                    }}>
                        <TextField size="small" placeholder="İşçi adı..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (<InputAdornment position="start"><Search fontSize="small" /></InputAdornment>),
                                endAdornment: (<InputAdornment position="end"><IconButton size="small" onClick={() => { setSearchQuery(''); setShowSearch(false); }}><Close fontSize="small" /></IconButton></InputAdornment>)
                            }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'background.default' }, width: '100%' }} />
                    </Box>
                    <Box sx={{ width: showSearch ? 0 : 40, opacity: showSearch ? 0 : 1, transition: 'all 0.3s ease', overflow: 'hidden', display: 'flex', justifyContent: 'center', transform: showSearch ? 'scale(0)' : 'scale(1)' }}>
                        <IconButton size="small" onClick={() => setShowSearch(true)}><Search /></IconButton>
                    </Box>
                </Box>
                <Tooltip title="Departament üzrə filtrlə">
                    <IconButton size="small" onClick={(e) => setAnchorElFilter(e.currentTarget)} color={filterDept ? 'primary' : 'default'}><FilterList /></IconButton>
                </Tooltip>
                <Menu anchorEl={anchorElFilter} open={Boolean(anchorElFilter)} onClose={() => setAnchorElFilter(null)}>
                    <MenuItem onClick={() => { setFilterDept(null); setAnchorElFilter(null); }} selected={!filterDept}>Bütün Departamentlər</MenuItem>
                    {uniqueDepts.map(dept => (<MenuItem key={dept} onClick={() => { setFilterDept(dept); setAnchorElFilter(null); }} selected={filterDept === dept}>{dept}</MenuItem>))}
                </Menu>
                <Box sx={{ borderLeft: '1px solid #ddd', height: 24, mx: 1 }} />
                <IconButton onClick={prevMonth} size="small"><ChevronLeft /></IconButton>
                <IconButton onClick={nextMonth} size="small"><ChevronRight /></IconButton>
            </Box>
        </Box>
    );

    const renderDays = () => {
        const days = [];
        const startDate = startOfWeek(currentMonth, { weekStartsOn: 1 });
        for (let i = 0; i < 7; i++) {
            days.push(
                <Box key={i} flex={1} textAlign="center">
                    <Typography variant="caption" fontWeight="bold" color="text.secondary">
                        {format(addDays(startDate, i), 'EEE', { locale: az })}
                    </Typography>
                </Box>
            );
        }
        return <Box display="flex" mb={1}>{days}</Box>;
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
        const rows = [];
        let days = [];
        let day = startDate;

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const formattedDate = format(day, "d");
                const dayVacations = getVacationsForDay(day);
                const isCurrentMonth = isSameMonth(day, monthStart);
                const { cols, rows: gridRows } = getGridDims(dayVacations.length);
                const currentDay = new Date(day); // Capture for closure

                days.push(
                    <Box
                        key={day}
                        className="calendar-cell" // Marker for rect calculation
                        sx={{
                            flex: 1, minHeight: 90,
                            border: '1px solid #e0e0e0',
                            bgcolor: isCurrentMonth ? 'background.paper' : '#f9fafb',
                            position: 'relative', overflow: 'hidden',
                            // Hover effect on cell
                            transition: 'box-shadow 0.2s, transform 0.2s',
                            '&:hover': {
                                boxShadow: 'inset 0 0 0 1px #2196f3',
                                zIndex: 1
                            }
                        }}
                    >
                        {/* Grid Layer */}
                        <Box sx={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            display: 'grid',
                            gridTemplateColumns: `repeat(${cols}, 1fr)`,
                            gridTemplateRows: `repeat(${gridRows}, 1fr)`,
                        }}>
                            {dayVacations.map((vac, index) => {
                                const isPending = vac.status === 'pending';
                                const displayColor = isPending ? '#ed6c02' : stringToColor(vac.employee_name || 'Unknown');
                                return (
                                    <Tooltip key={vac.id} title={`${vac.employee_name} (${isPending ? 'Gözləyir' : vac.vacation_type || 'Məzuniyyət'})`}>
                                        <Box sx={{
                                            bgcolor: `${displayColor}cc`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white', fontSize: '10px', fontWeight: 'bold',
                                            border: '0.5px solid rgba(255,255,255,0.2)',
                                            userSelect: 'none',
                                            cursor: 'pointer',
                                            '&:hover': { bgcolor: displayColor }
                                        }} onClick={(e) => { e.stopPropagation(); onVacationClick && onVacationClick(vac); }}>
                                            {/* Show only first initial if small grid, or more if space permits */}
                                            {vac.employee_name?.charAt(0).toUpperCase()}
                                        </Box>
                                    </Tooltip>
                                );
                            })}
                        </Box>

                        {/* Date Number */}
                        <Box sx={{ position: 'absolute', top: 4, left: 4, zIndex: 2, pointerEvents: 'none' }}>
                            <Typography variant="caption" sx={{
                                color: isSameDay(day, new Date()) ? 'white' : 'text.primary',
                                fontWeight: 'bold',
                                bgcolor: isSameDay(day, new Date()) ? 'primary.main' : 'rgba(255,255,255,0.8)',
                                borderRadius: 1, minWidth: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                            }}>{formattedDate}</Typography>
                        </Box>

                        {/* Expand Icon - Only if we have vacations */}
                        {dayVacations.length > 0 && (
                            <Box sx={{
                                position: 'absolute', top: 4, right: 4, zIndex: 10,
                                opacity: 0, transform: 'scale(0.8)',
                                transition: 'all 0.2s',
                                '.calendar-cell:hover &': { opacity: 1, transform: 'scale(1)' }
                            }}>
                                <IconButton
                                    size="small"
                                    onClick={(e) => handleExpand(currentDay, dayVacations, e)}
                                    sx={{ bgcolor: 'rgba(255,255,255,0.9)', padding: '2px', '&:hover': { bgcolor: 'white', color: 'primary.main' } }}
                                >
                                    <ExpandIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </Box>
                        )}
                    </Box>
                );
                day = addDays(day, 1);
            }
            rows.push(<Box key={day} display="flex">{days}</Box>);
            days = [];
        }
        return <Box>{rows}</Box>;
    };

    // --- Modal Renderer ---
    // We render this in a Portal so it's outside the overflow:hidden parents
    const renderModal = () => {
        if (!modalOpen || !sourceRect) return null;

        // Animation Styles
        // Initial state: matches source rect
        const initialStyle = {
            top: sourceRect.top,
            left: sourceRect.left,
            width: sourceRect.width,
            height: sourceRect.height,
            opacity: 0.5,
            borderRadius: '0px'
        };

        // Open state: Fixed centered large box
        // We calculate centered position
        const finalWidth = Math.min(600, window.innerWidth * 0.9);
        const finalHeight = Math.min(600, window.innerHeight * 0.8);
        const finalTop = (window.innerHeight - finalHeight) / 2;
        const finalLeft = (window.innerWidth - finalWidth) / 2;

        const openStyle = {
            top: finalTop,
            left: finalLeft,
            width: finalWidth,
            height: finalHeight,
            opacity: 1,
            borderRadius: '12px'
        };

        const currentStyle = animState === 'open' ? openStyle : initialStyle;

        // Grid for Modal
        const { cols: mCols, rows: mRows } = modalContent ? getGridDims(modalContent.vacations.length) : { cols: 1, rows: 1 };

        return (
            <Portal>
                {/* Overlay Backdop */}
                <Box
                    onClick={handleCloseModal}
                    sx={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        bgcolor: 'rgba(0,0,0,0.5)',
                        zIndex: 1300,
                        opacity: animState === 'open' ? 1 : 0,
                        transition: 'opacity 0.4s ease',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                />

                {/* Animated Card */}
                <Paper
                    elevation={12}
                    sx={{
                        position: 'fixed',
                        zIndex: 1301,
                        overflow: 'hidden',
                        bgcolor: 'background.paper',
                        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', // Bouncy spring
                        ...currentStyle,
                        display: 'flex', flexDirection: 'column'
                    }}
                >
                    {/* Header */}
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: animState === 'open' ? 1 : 0, transition: 'opacity 0.2s 0.1s' }}>
                        <Typography variant="h6" fontWeight="bold">
                            {modalContent && format(modalContent.date, 'd MMMM yyyy', { locale: az })}
                        </Typography>
                        <IconButton onClick={handleCloseModal} size="small"><CloseIcon /></IconButton>
                    </Box>

                    {/* Content */}
                    <Box sx={{ p: 1, overflow: 'auto', flex: 1, opacity: animState === 'open' ? 1 : 0, transition: 'opacity 0.2s 0.2s' }}>
                        <Box sx={{
                            display: 'grid',
                            gap: '4px',
                            gridTemplateColumns: `repeat(${mCols}, 1fr)`,
                            // In modal we want rows to be reasonable height, or fill available space if few
                            gridTemplateRows: `repeat(${mRows}, minmax(100px, 1fr))`,
                            minHeight: '100%'
                        }}>
                            {modalContent && modalContent.vacations.map((vac) => {
                                const isPending = vac.status === 'pending';
                                const displayColor = isPending ? '#ed6c02' : stringToColor(vac.employee_name || 'Unknown');
                                const emp = deptMap[vac.employee_id + '_emp'] || {};
                                return (
                                    <Paper key={vac.id} elevation={0} sx={{
                                        bgcolor: displayColor, color: 'white',
                                        p: 1, borderRadius: 1,
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        textAlign: 'center',
                                        transition: 'transform 0.2s',
                                        '&:hover': { transform: 'scale(1.02)', boxShadow: 2 }
                                    }} onClick={() => onVacationClick && onVacationClick(vac)}>
                                        <Typography variant="h4" fontWeight="bold" sx={{ opacity: 0.8 }}>
                                            {vac.employee_name?.charAt(0).toUpperCase()}
                                        </Typography>
                                        <Typography variant="body2" fontWeight="bold" sx={{ mt: 1, lineHeight: 1.2 }}>
                                            {vac.employee_name}
                                        </Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.9, mt: 0.5 }}>
                                            {emp.department || 'Departament yoxdur'}
                                        </Typography>
                                        {isPending && <Box sx={{ mt: 1, bgcolor: 'rgba(0,0,0,0.2)', px: 1, borderRadius: 4, fontSize: '10px' }}>Təsdiq gözləyir</Box>}
                                    </Paper>
                                );
                            })}
                        </Box>
                    </Box>
                </Paper>
            </Portal>
        );
    };

    return (
        <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
            {renderHeader()}
            {renderDays()}
            {renderCells()}
            {renderModal()}
        </Paper>
    );
};

export default VacationCalendar;
