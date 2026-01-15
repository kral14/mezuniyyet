import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  IconButton,
  InputAdornment,
  Link,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Grid
} from '@mui/material';
import { Visibility, VisibilityOff, Business, Search, AddCircle, PersonAdd, ContentCopy, CheckCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api, { isTauri } from '../services/api';
import CreepyButton from '../components/CreepyButton';

import { useSound } from '../context/SoundContext';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');

  // Tenant State
  const [companyName, setCompanyName] = useState('Şirkət seçilməyib');
  const [tenantId, setTenantId] = useState(null);
  const [openTenantDialog, setOpenTenantDialog] = useState(false);
  const [openCreateCompanyDialog, setOpenCreateCompanyDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Smart Loading State
  const [wakingUp, setWakingUp] = useState(false);


  const navigate = useNavigate();
  const theme = useTheme();
  const { playSuccess, playError, playClick } = useSound();

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);

      // 1. Load saved tenant first
      const savedTenantStr = localStorage.getItem('saved_tenant');
      let tenantIdToConnect = null;

      if (savedTenantStr) {
        try {
          const savedTenant = JSON.parse(savedTenantStr);
          setCompanyName(savedTenant.company_name || savedTenant.name);
          setTenantId(savedTenant.id);
          tenantIdToConnect = savedTenant.id;
        } catch (e) {
          console.error("Error parsing saved tenant:", e);
        }
      }

      // 2. If we have a user and a tenant, connect FIRST then navigate
      const currentUser = localStorage.getItem('user');
      if (currentUser && tenantIdToConnect) {
        setWakingUp(true); // Show waking up animation immediately for auto-login

        let attempts = 0;
        const maxAttempts = 10; // Try for ~30-40 seconds

        const tryConnect = async () => {
          console.log(`Auto-connecting attempt ${attempts + 1}...`);
          try {
            await api.setActiveTenant(tenantIdToConnect);
            // Also verify connection with a quick ping if needed, but setActiveTenant checks API

            if (tenantIdToConnect) {
              const localToken = localStorage.getItem('token');
              await api.setAuthState(localToken, tenantIdToConnect);
            }

            console.log("Auto-connected! Navigating to dashboard...");
            navigate('/dashboard/home');
          } catch (e) {
            console.error(`Auto-connect attempt ${attempts + 1} failed:`, e);
            attempts++;
            if (attempts < maxAttempts) {
              // Retry after delay
              setTimeout(tryConnect, 3000);
            } else {
              // Give up
              setWakingUp(false);
              setLoading(false);
              setError("Serverə qoşulmaq mümkün olmadı. İnternetinizi yoxlayın və ya yenidən cəhd edin.");
            }
          }
        };

        tryConnect();
        return; // Return here, let the async recursion handle flow
      }

      // 3. Load saved credentials for the form
      const savedUser = localStorage.getItem('remembered_username');
      const savedPass = localStorage.getItem('remembered_password');
      if (savedUser && savedPass) {
        setUsername(savedUser);
        setPassword(savedPass);
        setRememberMe(true);
      }

      // 4. Fallback: Load active from backend if not navigation
      try {
        const tenant = await api.loadActiveTenant();
        if (tenant && typeof tenant === 'object') {
          setCompanyName(tenant.company_name || tenant.name);
          setTenantId(tenant.id);
        }
      } catch (err) { /* silent */ }

      setLoading(false);
    };

    initAuth();
  }, [navigate]);

  const handleSearchTenants = async () => {
    if (!searchQuery.trim()) return;
    playClick();
    setLoading(true);
    try {
      const results = await api.searchTenants(searchQuery);
      setSearchResults(results || []);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Axtarış xətası: ' + (err.message || err));
      playError();
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTenant = async (tenant) => {
    playClick();
    try {
      setLoading(true);
      await api.setActiveTenant(tenant.id);
      setCompanyName(tenant.company_name || tenant.name);
      setTenantId(tenant.id);

      // Save to LocalStorage
      localStorage.setItem('saved_tenant', JSON.stringify(tenant));

      // Clear previous user session when switching companies
      // localStorage.removeItem('token'); // No need, browser handles cookie
      localStorage.removeItem('user');

      setOpenTenantDialog(false);
      setError('');
      playSuccess();
    } catch (err) {
      console.error('Failed to set tenant:', err);
      setError('Şirkətə qoşulmaq mümkün olmadı: ' + err);
      playError();
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    playClick();

    if (!tenantId) {
      setError('Zəhmət olmasa əvvəlcə şirkət seçin!');
      setOpenTenantDialog(true);
      playError();
      return;
    }

    // Start Loading & Watchdog
    setLoading(true);
    setWakingUp(false);
    let shouldKeepLoading = false;

    // If request takes more than 3s, show "Waking Up" message
    const wakeUpTimer = setTimeout(() => {
      setWakingUp(true);
    }, 2500);

    try {
      console.log('Attempting login...');

      // Ensure the backend knows about the selected tenant
      if (isTauri() && tenantId) {
        await api.setActiveTenant(tenantId);
      }

      const response = await api.loginUser(username, password);
      console.log('Login Response:', response);

      if (response && response.success) {
        playSuccess();
        // Login successful - Persist user
        localStorage.setItem('user', JSON.stringify(response.user));
        // Token handled by Secure HttpOnly Cookie

        // Notify SocketContext to connect
        window.dispatchEvent(new Event('auth-login'));

        // Remember credentials if checked
        if (rememberMe) {
          localStorage.setItem('remembered_username', username);
          localStorage.setItem('remembered_password', password);
        } else {
          localStorage.removeItem('remembered_username');
          localStorage.removeItem('remembered_password');
        }

        navigate('/dashboard/home');
      } else {
        setError(response?.message || 'Giriş uğursuz oldu');
        playError();
      }
    } catch (err) {
      console.error('Login error:', err);
      const errMsg = err.message || JSON.stringify(err);

      // Check for connection refusal or network error
      const isNetworkError = errMsg.includes('Failed to fetch') || errMsg.includes('Network request failed');

      if (isNetworkError) {
        // Assume server is starting up
        setWakingUp(true);
        shouldKeepLoading = true; // Flag to prevent turning off loading

        // Retry logic could go here, or just let the user know and they can click again
        // For now, keep the "Waking Up" overlay visible for a bit longer so they see it
        setTimeout(() => {
          setWakingUp(false);
          setLoading(false); // Turn off manually after timeout
        }, 5000);
      } else {
        setError('Sistem xətası baş verdi: ' + errMsg);
        playError();
        setWakingUp(false);
      }
    } finally {
      clearTimeout(wakeUpTimer);
      if (!shouldKeepLoading) {
        setLoading(false);
      }
    }
  };

  // --- Company Creation Logic ---
  const [newCompany, setNewCompany] = useState({ name: '', dbUrl: '' });
  const [createdTenantId, setCreatedTenantId] = useState(null);
  const [openSuccessDialog, setOpenSuccessDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreateCompany = async () => {
    setLoading(true);
    try {
      // 1. Initialize Tables + Register with Central Server
      // This returns the REAL Tenant ID from the central server
      const tenantId = await api.setupNewCompany(newCompany.name, newCompany.dbUrl);

      setCreatedTenantId(tenantId);
      setOpenCreateCompanyDialog(false);
      setOpenSuccessDialog(true);

      // Auto-select the new company for convenience
      setSearchQuery(tenantId);
      // Trigger search immediately
      const results = await api.searchTenants(tenantId);
      if (results && results.length > 0) {
        handleSelectTenant(results[0]);
      } else {
        // Fallback if search latency issue
        setOpenTenantDialog(true);
      }

    } catch (err) {
      alert("Xəta: " + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        p: 2
      }}
    >
      {loading && !tenantId ? (
        <Box sx={{ textAlign: 'center', color: 'white' }}>
          <CircularProgress color="inherit" size={60} />
          <Typography mt={2}>Sistemə giriş edilir...</Typography>
        </Box>
      ) : (
        <Card sx={{ maxWidth: 450, width: '100%', borderRadius: 4, boxShadow: 24, overflow: 'hidden', position: 'relative' }}>

          {/* --- Loading Overlay for Waking Up --- */}
          {loading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: 'rgba(255,255,255,0.92)',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                p: 4
              }}
            >
              <CircularProgress size={60} thickness={4} sx={{ color: wakingUp ? '#f59e0b' : 'primary.main', mb: 3 }} />

              {wakingUp ? (
                <>
                  <Typography variant="h6" color="warning.dark" gutterBottom fontWeight="bold">
                    Server Oyanır...
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Server yuxu rejimindədir. Bu proses 30-50 saniyə çəkə bilər.
                    <br />
                    Zəhmət olmasa səhifəni bağlamayın.
                  </Typography>
                </>
              ) : (
                <Typography variant="h6" color="primary.main">
                  Giriş edilir...
                </Typography>
              )}
            </Box>
          )}
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" component="h1" fontWeight="bold" color="primary.main" gutterBottom>
                Sistemə Giriş
              </Typography>

              {/* Company Selector */}
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  color: 'text.secondary',
                  '&:hover': { color: 'primary.main' },
                  bgcolor: 'rgba(0,0,0,0.05)',
                  px: 2, py: 0.5,
                  borderRadius: 4
                }}
                onClick={() => setOpenTenantDialog(true)}
              >
                <Business fontSize="small" />
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    {companyName}
                  </Typography>
                  {tenantId && (
                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', fontSize: '0.7rem' }}>
                      ID: {tenantId}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>

            <form onSubmit={handleLogin}>
              {error && (
                <Typography color="error" variant="body2" sx={{ mb: 2, textAlign: 'center' }}>
                  {error}
                </Typography>
              )}
              <TextField
                fullWidth
                label="İstifadəçi adı"
                variant="outlined"
                margin="normal"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Şifrə"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 1 }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" color="text.secondary">
                    Məni xatırla (Avtomatik giriş)
                  </Typography>
                }
                sx={{ mb: 3 }}
              />

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Box sx={{ width: '100%' }}>
                  <CreepyButton type="submit" disabled={loading}>
                    Giriş
                  </CreepyButton>
                </Box>

                <Box sx={{ width: '100%' }}>
                  <CreepyButton
                    type="button"
                    onClick={() => {
                      if (!tenantId) {
                        setError('Qeydiyyat üçün əvvəlcə şirkət seçilməlidir!');
                        setOpenTenantDialog(true);
                      } else {
                        navigate('/register');
                      }
                    }}
                  >
                    Qeydiyyat
                  </CreepyButton>
                </Box>
              </Box>

              <Box sx={{ textAlign: 'center' }}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => console.log('Forgot password')}
                  underline="hover"
                  sx={{ color: 'text.secondary' }}
                >
                  Şifrəmi Unutdum
                </Link>
              </Box>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tenant Selection Dialog */}
      <Dialog open={openTenantDialog} onClose={() => setOpenTenantDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            Şirkət Seçimi
            <Button
              startIcon={<AddCircle />}
              size="small"
              onClick={() => { setOpenTenantDialog(false); setOpenCreateCompanyDialog(true); }}
            >
              Yeni Şirkət
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Şirkət adını daxil edin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchTenants()}
              size="small"
            />
            <Button variant="contained" onClick={handleSearchTenants} disabled={loading}>
              <Search />
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
          ) : (
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {searchResults.map((tenant) => (
                <ListItem key={tenant.id} disablePadding sx={{ borderBottom: '1px solid #eee', flexDirection: 'column', alignItems: 'stretch', py: 1 }}>
                  <ListItemButton onClick={() => handleSelectTenant(tenant)} sx={{ flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Business sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="subtitle1" fontWeight="medium">
                        {tenant.company_name || tenant.name}
                      </Typography>
                    </Box>
                    <TextField
                      fullWidth
                      size="small"
                      label="Tenant ID"
                      value={tenant.id}
                      InputProps={{
                        readOnly: true,
                        sx: { fontSize: '0.85rem', fontFamily: 'monospace' }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      sx={{ pointerEvents: 'none' }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
              {searchResults.length === 0 && searchQuery && (
                <Typography align="center" color="text.secondary" sx={{ py: 2 }}>Nəticə tapılmadı</Typography>
              )}
            </List>
          )}
        </DialogContent>
      </Dialog >

      {/* Create Company Dialog (Admin) */}
      < Dialog open={openCreateCompanyDialog} onClose={() => setOpenCreateCompanyDialog(false)} fullWidth maxWidth="xs" >
        <DialogTitle>Yeni Şirkət Bazası Yarat</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            PostgreSQL Connection String daxil edin. Sistem avtomatik lazımi cədvəlləri yaradacaq.
          </Typography>
          <TextField
            label="Şirkət Adı" fullWidth sx={{ mb: 2 }}
            value={newCompany.name}
            onChange={e => setNewCompany({ ...newCompany, name: e.target.value })}
          />
          <TextField
            label="Database URL"
            placeholder="Bağlantı sətri (Connection String)"
            fullWidth multiline rows={2}
            value={newCompany.dbUrl}
            onChange={e => setNewCompany({ ...newCompany, dbUrl: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateCompanyDialog(false)}>Ləğv et</Button>
          <Button variant="contained" onClick={handleCreateCompany} disabled={loading || !newCompany.dbUrl}>
            {loading ? <CircularProgress size={24} /> : "Yarat və Hazırla"}
          </Button>
        </DialogActions>
      </Dialog >

      {/* Success Dialog for Created Tenant */}
      < Dialog open={openSuccessDialog} onClose={() => setOpenSuccessDialog(false)} maxWidth="sm" fullWidth >
        <DialogTitle sx={{ bgcolor: 'success.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircle />
          Şirkət uğurla yaradıldı!
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" gutterBottom>
            Sizin Tenant ID:
          </Typography>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: 'grey.100',
            p: 2,
            borderRadius: 1,
            border: '2px solid',
            borderColor: 'primary.main'
          }}>
            <Typography
              variant="h6"
              sx={{
                fontFamily: 'monospace',
                flex: 1,
                wordBreak: 'break-all',
                color: 'primary.main',
                fontWeight: 'bold'
              }}
            >
              {createdTenantId}
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={copied ? <CheckCircle /> : <ContentCopy />}
              onClick={() => {
                navigator.clipboard.writeText(createdTenantId);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              color={copied ? 'success' : 'primary'}
            >
              {copied ? 'Kopyalandı' : 'Kopyala'}
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Bu ID-ni yadda saxlayın. İndi avtomatik olaraq bu şirkət seçiləcək.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={async () => {
              setOpenSuccessDialog(false);
              // Auto-select the new company
              setSearchQuery(createdTenantId);
              const results = await api.searchTenants(createdTenantId);
              if (results && results.length > 0) {
                handleSelectTenant(results[0]);
              } else {
                setOpenTenantDialog(true);
              }
            }}
          >
            Tamam
          </Button>
        </DialogActions>
      </Dialog >
    </Box >
  );
};

export default Login;
