import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    TextField,
    Button,
    Typography,
    Paper,
    InputAdornment,
    IconButton,
    Checkbox,
    FormControlLabel,
    Alert,
} from '@mui/material';
import { Visibility, VisibilityOff, Login as LoginIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.username || !formData.password) {
            setError('Bütün xanaları doldurun');
            return;
        }

        setLoading(true);
        const result = await login(formData.username, formData.password);
        setLoading(false);

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error || 'İstifadəçi adı və ya şifrə yanlışdır');
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Animated background circles */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: 'linear',
                }}
                style={{
                    position: 'absolute',
                    width: '400px',
                    height: '400px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    top: '-100px',
                    right: '-100px',
                }}
            />

            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    rotate: [360, 180, 0],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: 'linear',
                }}
                style={{
                    position: 'absolute',
                    width: '300px',
                    height: '300px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.07)',
                    bottom: '-50px',
                    left: '-50px',
                }}
            />

            <Container maxWidth="sm">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Paper
                        elevation={24}
                        sx={{
                            p: 5,
                            borderRadius: 4,
                            backdropFilter: 'blur(10px)',
                            backgroundColor: 'rgba(26, 26, 46, 0.95)',
                        }}
                    >
                        {/* Header */}
                        <Box sx={{ textAlign: 'center', mb: 4 }}>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            >
                                <LoginIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                            </motion.div>

                            <Typography variant="h4" gutterBottom fontWeight={700} color="white">
                                Xoş Gəldiniz
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Məzuniyyət İdarəetmə Sistemi
                            </Typography>
                        </Box>

                        {/* Error Alert */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <Alert severity="error" sx={{ mb: 3 }}>
                                    {error}
                                </Alert>
                            </motion.div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleSubmit}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                <TextField
                                    fullWidth
                                    label="İstifadəçi adı və ya email"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    autoComplete="username"
                                    autoFocus
                                    disabled={loading}
                                />

                                <TextField
                                    fullWidth
                                    label="Şifrə"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="current-password"
                                    disabled={loading}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={rememberMe}
                                                onChange={(e) => setRememberMe(e.target.checked)}
                                                disabled={loading}
                                            />
                                        }
                                        label="Yadda saxla"
                                    />
                                    <Button
                                        variant="text"
                                        size="small"
                                        disabled={loading}
                                        sx={{ textTransform: 'none' }}
                                    >
                                        Şifrəni unutdum?
                                    </Button>
                                </Box>

                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        size="large"
                                        type="submit"
                                        disabled={loading}
                                        sx={{
                                            py: 1.5,
                                            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                                            boxShadow: '0 3px 5px 2px rgba(102, 126, 234, .3)',
                                        }}
                                    >
                                        {loading ? 'Daxil olunur...' : 'Daxil Ol'}
                                    </Button>
                                </motion.div>
                            </Box>
                        </form>

                        {/* Demo Credentials */}
                        <Box sx={{ mt: 4, p: 2, borderRadius: 2, bgcolor: 'rgba(102, 126, 234, 0.1)' }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                                Demo üçün: istənilən istifadəçi adı və şifrə
                            </Typography>
                        </Box>
                    </Paper>
                </motion.div>
            </Container>
        </Box>
    );
};

export default LoginPage;
