import React, { useState, useContext, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Button,
  Box,
  Stack,
  Typography,
  Grid,
  Chip,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { WidgetContext } from '../context/WidgetContext';
import {
  createWidgetSettingsForType,
  getLayoutPreset,
  getPositionLabel,
  FONT_OPTIONS,
  LAYOUT_PRESETS,
  normalizeLayoutPreset,
  WIDGET_OPTIONS,
} from './widgetConfig';

const fieldStyles = {
  '& .MuiOutlinedInput-root': {
    color: '#f3f3f3',
    bgcolor: 'rgba(255,255,255,0.04)',
    borderRadius: 2,
    transition: 'background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
    '&:hover': {
      bgcolor: 'rgba(255,255,255,0.06)',
    },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.16)' },
    '&.Mui-focused': {
      bgcolor: 'rgba(33,150,243,0.08)',
      boxShadow: '0 0 0 3px rgba(33,150,243,0.12)',
    },
    '&.Mui-focused fieldset': { borderColor: '#4dabf5' },
  },
  '& .MuiInputBase-input::placeholder': { color: '#7e8794', opacity: 1 },
  '& .MuiInputLabel-root': { color: '#9ea7b3' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#90caf9' },
};

const selectStyles = {
  color: '#f3f3f3',
  bgcolor: 'rgba(255,255,255,0.04)',
  borderRadius: 2,
  transition: 'background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' },
  '&:hover': {
    bgcolor: 'rgba(255,255,255,0.06)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.16)' },
  '&.Mui-focused': {
    bgcolor: 'rgba(33,150,243,0.08)',
    boxShadow: '0 0 0 3px rgba(33,150,243,0.12)',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#4dabf5' },
  '& .MuiSvgIcon-root': { color: '#d5d9df' },
};

const menuProps = {
  PaperProps: {
    sx: {
      bgcolor: '#121212',
      color: '#f3f3f3',
      border: '1px solid rgba(255,255,255,0.08)',
      backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
      '& .MuiList-root': {
        py: 0.5,
      },
      '& .MuiMenuItem-root': {
        color: '#f3f3f3',
        borderRadius: 1,
        mx: 0.5,
        my: 0.25,
        '&:hover': {
          bgcolor: 'rgba(33,150,243,0.16)',
        },
        '&.Mui-selected': {
          bgcolor: 'rgba(33,150,243,0.24)',
          '&:hover': {
            bgcolor: 'rgba(33,150,243,0.3)',
          },
        },
      },
    },
  },
};

const buildSettingsDefaultsFromInstances = (layoutWidgets, widgetSettingsMap, previousSettings) => {
  const nextSettings = { ...previousSettings };

  layoutWidgets.forEach((widgetType, position) => {
    const instanceSettings = widgetSettingsMap[position];
    if (!widgetType || !instanceSettings) return;

    if (widgetType === 'clock' && instanceSettings.clockFormat) {
      nextSettings.clockFormat = instanceSettings.clockFormat;
    }

    if (widgetType === 'weather') {
      nextSettings.location = instanceSettings.location || nextSettings.location;
      nextSettings.tempUnit = instanceSettings.tempUnit || nextSettings.tempUnit;
      nextSettings.clockFormat = instanceSettings.clockFormat || nextSettings.clockFormat;
    }

    if (widgetType === 'calendar' && instanceSettings.icsUrl) {
      nextSettings.icsUrl = instanceSettings.icsUrl;
    }

    if (widgetType === 'airquality') {
      nextSettings.location = instanceSettings.location || nextSettings.location;
    }

    if (widgetType === 'compliments') {
      nextSettings.complimentsConfigUrl = instanceSettings.complimentsConfigUrl || nextSettings.complimentsConfigUrl;
      nextSettings.location = instanceSettings.location || nextSettings.location;
    }
  });

  return nextSettings;
};

const entitlementEndpoint = import.meta.env.VITE_ENTITLEMENT_ENDPOINT || '/v1/entitlements/me';

const getPremiumStatusFromEntitlement = (payload) => {
  const plan = payload?.plan || payload?.subscription?.plan;
  const status = payload?.status || payload?.subscription?.status;
  const premiumFlag = payload?.premium;

  if (premiumFlag === true) return 'premium';

  if (typeof plan === 'string' && plan.toLowerCase() === 'premium') {
    if (!status || ['active', 'trialing'].includes(String(status).toLowerCase())) {
      return 'premium';
    }
  }

  if (premiumFlag === false) return 'free';
  if (typeof plan === 'string') return 'free';

  return 'unknown';
};

const getPremiumChipConfig = (status) => {
  if (status === 'premium') {
    return {
      label: 'Premium',
      sx: {
        height: 22,
        bgcolor: '#f4b400',
        color: '#111111',
        fontWeight: 700,
      },
    };
  }

  if (status === 'free') {
    return {
      label: 'Free',
      sx: {
        height: 22,
        bgcolor: 'transparent',
        color: '#b0b0b0',
        border: '1px solid #666666',
      },
    };
  }

  if (status === 'error') {
    return {
      label: 'Entitlement Error',
      sx: {
        height: 22,
        bgcolor: 'transparent',
        color: '#ff8a80',
        border: '1px solid #ff8a80',
      },
    };
  }

  return {
    label: 'Checking...',
    sx: {
      height: 22,
      bgcolor: 'transparent',
      color: '#90caf9',
      border: '1px solid #90caf9',
    },
  };
};

export const SettingsPanel = ({ isOpen, onClose }) => {
  const { settings, layout, widgetSettings, saveDashboardConfiguration } = useContext(WidgetContext);
  const auth = useAuth();
  const [localSettings, setLocalSettings] = useState(settings);
  const [localLayout, setLocalLayout] = useState(layout.widgets);
  const [localLayoutPreset, setLocalLayoutPreset] = useState(layout.preset);
  const [localWidgetSettings, setLocalWidgetSettings] = useState(widgetSettings);
  const [authMode, setAuthMode] = useState('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [authNewPassword, setAuthNewPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [premiumStatus, setPremiumStatus] = useState('unknown');
  const [entitlementDetail, setEntitlementDetail] = useState('');

  const accountLabel = auth.user?.name || auth.user?.email || auth.user?.username || 'Signed in user';

  useEffect(() => {
    if (!isOpen) return;

    setLocalSettings(settings);
    setLocalLayout(layout.widgets);
    setLocalLayoutPreset(layout.preset);
    setLocalWidgetSettings(widgetSettings);
    setAuthMessage('');
    auth.clearError();
  }, [isOpen, layout.preset, layout.widgets, settings, widgetSettings]);

  useEffect(() => {
    if (!isOpen || !auth.isAuthenticated || !auth.user?.accessToken) {
      setPremiumStatus('unknown');
      setEntitlementDetail('');
      return;
    }

    const controller = new AbortController();

    const fetchEntitlement = async () => {
      setPremiumStatus('unknown');
      setEntitlementDetail('');

      try {
        const response = await fetch(entitlementEndpoint, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${auth.user.accessToken}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Entitlement check failed: ${response.status}`);
        }

        const payload = await response.json();
        const nextStatus = getPremiumStatusFromEntitlement(payload);
        setPremiumStatus(nextStatus === 'unknown' ? 'free' : nextStatus);

        if (payload?.currentPeriodEnd) {
          setEntitlementDetail(`Renews until ${new Date(payload.currentPeriodEnd).toLocaleDateString()}`);
        }
      } catch (err) {
        if (err?.name !== 'AbortError') {
          setPremiumStatus('error');
          setEntitlementDetail('Could not load subscription status from backend.');
        }
      }
    };

    fetchEntitlement();

    return () => controller.abort();
  }, [isOpen, auth.isAuthenticated, auth.user?.accessToken]);

  useEffect(() => {
    if (!auth.isAuthenticated) return;

    setAuthMode('login');
    setAuthPassword('');
    setAuthCode('');
    setAuthNewPassword('');
    setAuthMessage('You are signed in.');
  }, [auth.isAuthenticated]);

  useEffect(() => {
    if (auth.isAuthenticated) return;
    if (auth.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
      setAuthMode('newPassword');
      setAuthMessage('Set a new password to finish signing in.');
    }
  }, [auth.isAuthenticated, auth.signInStep]);

  const switchAuthMode = (mode) => {
    setAuthMode(mode);
    setAuthMessage('');
    auth.clearError();
  };

  const handleLogin = async () => {
    if (!authEmail || !authPassword) {
      setAuthMessage('Enter your email and password.');
      return;
    }

    setAuthBusy(true);
    const result = await auth.login({ email: authEmail.trim(), password: authPassword });
    setAuthBusy(false);

    if (result.success && result.isAuthenticated) {
      setAuthMessage('Logged in successfully.');
      setAuthPassword('');
      return;
    }

    if (!result.success && result.nextStep) {
      if (result.nextStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        setAuthMode('newPassword');
        setAuthMessage('Set a new password to finish signing in.');
      } else {
        setAuthMessage(`Login needs extra verification (${result.nextStep}). Complete that step and try again.`);
      }
    }
  };

  const handleCompleteNewPassword = async () => {
    if (!authNewPassword) {
      setAuthMessage('Enter a new password.');
      return;
    }

    setAuthBusy(true);
    const result = await auth.completeNewPassword({ newPassword: authNewPassword });
    setAuthBusy(false);

    if (result.success && result.isAuthenticated) {
      setAuthMessage('Password updated. Logged in successfully.');
      setAuthPassword('');
      setAuthCode('');
      setAuthNewPassword('');
      return;
    }

    if (!result.success && result.nextStep) {
      setAuthMessage(`Login still needs verification (${result.nextStep}).`);
    }
  };

  const handleSignup = async () => {
    if (!authName.trim() || !authEmail || !authPassword) {
      setAuthMessage('Enter your name, email, and password to sign up.');
      return;
    }

    setAuthBusy(true);
    const result = await auth.register({
      name: authName.trim(),
      email: authEmail.trim(),
      password: authPassword,
    });
    setAuthBusy(false);

    if (result.success) {
      if (result.nextStep === 'CONFIRM_SIGN_UP') {
        setAuthMessage('Account created. Enter the verification code from your email.');
        setAuthMode('confirm');
      } else {
        setAuthMessage('Sign up completed. You can now use your account.');
      }
      setAuthPassword('');
    }
  };

  const handleConfirmSignup = async () => {
    if (!authEmail || !authCode) {
      setAuthMessage('Enter your email and verification code.');
      return;
    }

    setAuthBusy(true);
    const result = await auth.confirmRegistration({ email: authEmail.trim(), code: authCode.trim() });
    setAuthBusy(false);

    if (result.success) {
      setAuthMessage('Email verified. Log in with your new account.');
      setAuthCode('');
      setAuthMode('login');
    }
  };

  const handleLogout = async () => {
    setAuthBusy(true);
    const result = await auth.logout();
    setAuthBusy(false);

    if (result.success) {
      setAuthMessage('Logged out.');
      setAuthCode('');
      setAuthPassword('');
      setAuthNewPassword('');
      setAuthName('');
      setAuthEmail('');
      setAuthMode('login');
    }
  };

  const handleLayoutChange = (position, widgetType) => {
    const nextLayout = [...localLayout];
    nextLayout[position] = widgetType;
    setLocalLayout(nextLayout);

    setLocalWidgetSettings(prev => {
      const next = { ...prev };

      if (!widgetType) {
        delete next[position];
        return next;
      }

      if (next[position]?.widgetType === widgetType) {
        return next;
      }

      const existingInstance = Object.values(next).find(item => item?.widgetType === widgetType);
      next[position] = existingInstance
        ? { ...existingInstance, widgetType }
        : createWidgetSettingsForType(widgetType, localSettings);

      return next;
    });
  };

  const handleDefaultSettingChange = (key, value) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    const nextSettings = buildSettingsDefaultsFromInstances(localLayout, localWidgetSettings, localSettings);
    saveDashboardConfiguration(localLayout, localWidgetSettings, nextSettings, localLayoutPreset);
    onClose();
  };

  const layoutPresetOptions = Object.values(LAYOUT_PRESETS);
  const activeLayoutPreset = getLayoutPreset(localLayoutPreset);
  const premiumChip = getPremiumChipConfig(premiumStatus);

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#1a1a1a',
          backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
          maxHeight: '90vh',
          scrollbarColor: '#3c4653 #161616',
          '& ::-webkit-scrollbar': {
            width: '10px',
          },
          '& ::-webkit-scrollbar-track': {
            background: '#161616',
          },
          '& ::-webkit-scrollbar-thumb': {
            background: 'linear-gradient(180deg, #3a4552, #2a313a)',
            borderRadius: '999px',
            border: '2px solid #161616',
          },
          '& ::-webkit-scrollbar-thumb:hover': {
            background: 'linear-gradient(180deg, #4a5868, #33404d)',
          },
        },
      }}
    >
      <DialogTitle sx={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 'bold', pb: 2 }}>
        Settings
      </DialogTitle>

      <DialogContent
        sx={{
          pt: 2,
          overflowY: 'auto',
          pr: 1.5,
          scrollbarWidth: 'thin',
          scrollbarColor: '#3c4653 #161616',
          '&::-webkit-scrollbar': {
            width: '10px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#161616',
            borderRadius: '999px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'linear-gradient(180deg, #3a4552, #2a313a)',
            borderRadius: '999px',
            border: '2px solid #161616',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'linear-gradient(180deg, #4a5868, #33404d)',
          },
        }}
      >
        <Stack spacing={4}>
          <Box>
            <Typography sx={{ color: '#ffffff', fontWeight: 'bold', mb: 2 }}>Account</Typography>
            <Stack spacing={1.5}>
              {auth.isLoading && (
                <Typography sx={{ color: '#999999', fontSize: '0.9rem' }}>Checking sign-in status...</Typography>
              )}

              {auth.error && (
                <Typography sx={{ color: '#ff8a80', fontSize: '0.85rem' }}>
                  {auth.error}
                </Typography>
              )}

              {authMessage && (
                <Typography sx={{ color: '#90caf9', fontSize: '0.85rem' }}>
                  {authMessage}
                </Typography>
              )}

              {!auth.isLoading && auth.isAuthenticated && (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography sx={{ color: '#c8e6c9', fontSize: '0.9rem' }}>
                      Signed in as {accountLabel}
                    </Typography>
                    <Chip size="small" label={premiumChip.label} sx={premiumChip.sx} />
                  </Box>

                  {entitlementDetail && (
                    <Typography sx={{ color: '#999999', fontSize: '0.8rem' }}>
                      {entitlementDetail}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      onClick={handleLogout}
                      disabled={authBusy}
                      variant="outlined"
                      sx={{
                        color: '#ffffff',
                        borderColor: '#444444',
                        '&:hover': { borderColor: '#555555', bgcolor: 'rgba(255,255,255,0.05)' },
                      }}
                    >
                      Log Out
                    </Button>
                  </Box>
                </>
              )}

              {!auth.isLoading && !auth.isAuthenticated && (
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      onClick={() => switchAuthMode('login')}
                      variant={authMode === 'login' ? 'contained' : 'outlined'}
                      size="small"
                      sx={{
                        bgcolor: authMode === 'login' ? '#2196f3' : 'transparent',
                        color: '#ffffff',
                        borderColor: '#444444',
                        '&:hover': {
                          borderColor: '#555555',
                          bgcolor: authMode === 'login' ? '#1976d2' : 'rgba(255,255,255,0.05)',
                        },
                      }}
                    >
                      Log In
                    </Button>
                    <Button
                      onClick={() => switchAuthMode('signup')}
                      variant={authMode === 'signup' ? 'contained' : 'outlined'}
                      size="small"
                      sx={{
                        bgcolor: authMode === 'signup' ? '#2196f3' : 'transparent',
                        color: '#ffffff',
                        borderColor: '#444444',
                        '&:hover': {
                          borderColor: '#555555',
                          bgcolor: authMode === 'signup' ? '#1976d2' : 'rgba(255,255,255,0.05)',
                        },
                      }}
                    >
                      Sign Up
                    </Button>
                    <Button
                      onClick={() => switchAuthMode('confirm')}
                      variant={authMode === 'confirm' ? 'contained' : 'outlined'}
                      size="small"
                      sx={{
                        bgcolor: authMode === 'confirm' ? '#2196f3' : 'transparent',
                        color: '#ffffff',
                        borderColor: '#444444',
                        '&:hover': {
                          borderColor: '#555555',
                          bgcolor: authMode === 'confirm' ? '#1976d2' : 'rgba(255,255,255,0.05)',
                        },
                      }}
                    >
                      Verify Code
                    </Button>
                    <Button
                      onClick={() => switchAuthMode('newPassword')}
                      variant={authMode === 'newPassword' ? 'contained' : 'outlined'}
                      size="small"
                      sx={{
                        bgcolor: authMode === 'newPassword' ? '#2196f3' : 'transparent',
                        color: '#ffffff',
                        borderColor: '#444444',
                        '&:hover': {
                          borderColor: '#555555',
                          bgcolor: authMode === 'newPassword' ? '#1976d2' : 'rgba(255,255,255,0.05)',
                        },
                      }}
                    >
                      New Password
                    </Button>
                  </Box>

                  {authMode === 'signup' && (
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Enter your full name"
                      variant="outlined"
                      sx={fieldStyles}
                    />
                  )}

                  <TextField
                    fullWidth
                    label="Email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="you@example.com"
                    variant="outlined"
                    sx={fieldStyles}
                  />

                  {authMode !== 'confirm' && authMode !== 'newPassword' && (
                    <TextField
                      fullWidth
                      label="Password"
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="Enter your password"
                      variant="outlined"
                      sx={fieldStyles}
                    />
                  )}

                  {authMode === 'confirm' && (
                    <TextField
                      fullWidth
                      label="Verification Code"
                      value={authCode}
                      onChange={(e) => setAuthCode(e.target.value)}
                      placeholder="Enter email verification code"
                      variant="outlined"
                      sx={fieldStyles}
                    />
                  )}

                  {authMode === 'newPassword' && (
                    <TextField
                      fullWidth
                      label="New Password"
                      type="password"
                      value={authNewPassword}
                      onChange={(e) => setAuthNewPassword(e.target.value)}
                      placeholder="Enter a new secure password"
                      variant="outlined"
                      sx={fieldStyles}
                    />
                  )}

                  {authMode === 'login' && (
                    <Button
                      onClick={handleLogin}
                      disabled={authBusy}
                      variant="contained"
                      sx={{
                        bgcolor: '#2196f3',
                        color: '#ffffff',
                        '&:hover': { bgcolor: '#1976d2' },
                      }}
                    >
                      {authBusy ? 'Logging In...' : 'Log In'}
                    </Button>
                  )}

                  {authMode === 'signup' && (
                    <Button
                      onClick={handleSignup}
                      disabled={authBusy}
                      variant="contained"
                      sx={{
                        bgcolor: '#2196f3',
                        color: '#ffffff',
                        '&:hover': { bgcolor: '#1976d2' },
                      }}
                    >
                      {authBusy ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  )}

                  {authMode === 'confirm' && (
                    <Button
                      onClick={handleConfirmSignup}
                      disabled={authBusy}
                      variant="contained"
                      sx={{
                        bgcolor: '#2196f3',
                        color: '#ffffff',
                        '&:hover': { bgcolor: '#1976d2' },
                      }}
                    >
                      {authBusy ? 'Verifying...' : 'Verify Email'}
                    </Button>
                  )}

                  {authMode === 'newPassword' && (
                    <Button
                      onClick={handleCompleteNewPassword}
                      disabled={authBusy}
                      variant="contained"
                      sx={{
                        bgcolor: '#2196f3',
                        color: '#ffffff',
                        '&:hover': { bgcolor: '#1976d2' },
                      }}
                    >
                      {authBusy ? 'Updating Password...' : 'Set New Password'}
                    </Button>
                  )}
                </Stack>
              )}

              <Typography sx={{ color: '#999999', fontSize: '0.8rem' }}>
                Premium unlock and service access can be tied to this account after backend entitlement checks are enabled.
              </Typography>
            </Stack>
          </Box>

          <Box>
            <Typography sx={{ color: '#ffffff', fontWeight: 'bold', mb: 3 }}>Dashboard Layout</Typography>
            <Stack spacing={2} sx={{ mb: 3 }}>
              <FormControl size="small" variant="outlined" sx={{ maxWidth: 300 }}>
                <InputLabel sx={{ color: '#cccccc' }}>Layout Preset</InputLabel>
                <Select
                  value={normalizeLayoutPreset(localLayoutPreset)}
                  onChange={(e) => setLocalLayoutPreset(normalizeLayoutPreset(e.target.value))}
                  label="Layout Preset"
                  sx={selectStyles}
                  MenuProps={menuProps}
                >
                  {layoutPresetOptions.map((preset) => (
                    <MenuItem key={preset.id} value={preset.id}>
                      {preset.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography sx={{ color: '#999999', fontSize: '0.85rem' }}>
                {activeLayoutPreset.description}
              </Typography>
            </Stack>
            <Stack spacing={3} divider={<Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />}>
              {activeLayoutPreset.rows.map((row) => {
                const colWidths = row.colSpans;
                return (
                  <Box key={row.id}>
                    <Typography sx={{ color: '#ffffff', fontSize: '1rem', mb: 1 }}>
                      {row.label}
                    </Typography>
                    <Grid container spacing={2}>
                      {row.positions.map((position, index) => (
                        <Grid item xs={12} md={colWidths[index]} key={position}>
                          <FormControl sx={{ minWidth: '150px' }} size="small" variant="outlined">
                            <InputLabel sx={{ color: '#cccccc' }}>{getPositionLabel(position, localLayoutPreset)}</InputLabel>
                            <Select
                              value={localLayout[position] || ''}
                              onChange={(e) => handleLayoutChange(position, e.target.value || null)}
                              label={getPositionLabel(position, localLayoutPreset)}
                              sx={selectStyles}
                              MenuProps={menuProps}
                            >
                              {WIDGET_OPTIONS.map((option) => (
                                <MenuItem key={option.label} value={option.value || ''}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                );
              })}
            </Stack>
          </Box>

          <Box>
            <Typography sx={{ color: '#ffffff', fontWeight: 'bold', mb: 2 }}>Appearance</Typography>
            <Stack spacing={2}>
              <FormControl size="small" variant="outlined" sx={{ maxWidth: 300 }}>
                <InputLabel sx={{ color: '#cccccc' }}>Font Family</InputLabel>
                <Select
                  value={localSettings.fontFamily || 'monospace'}
                  onChange={(e) => handleDefaultSettingChange('fontFamily', e.target.value)}
                  label="Font Family"
                  sx={selectStyles}
                  MenuProps={menuProps}
                >
                  {FONT_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value} sx={{ fontFamily: option.value }}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Box>

          <Box>
            <Typography sx={{ color: '#ffffff', fontWeight: 'bold', mb: 2 }}>Default Service API Keys</Typography>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Currents API Key (News - Primary)"
                type="password"
                value={localSettings.currentsApiKey || ''}
                onChange={(e) => handleDefaultSettingChange('currentsApiKey', e.target.value)}
                placeholder="Enter default Currents API key"
                variant="outlined"
                sx={fieldStyles}
              />
              <TextField
                fullWidth
                label="TheNewsAPI Key (News - Fallback)"
                type="password"
                value={localSettings.newsApiKey || ''}
                onChange={(e) => handleDefaultSettingChange('newsApiKey', e.target.value)}
                placeholder="Enter default TheNewsAPI key (optional)"
                variant="outlined"
                sx={fieldStyles}
              />
              <TextField
                fullWidth
                label="OpenWeather API Key (Weather / Air Quality / Compliments)"
                type="password"
                value={localSettings.openweatherApiKey || ''}
                onChange={(e) => handleDefaultSettingChange('openweatherApiKey', e.target.value)}
                placeholder="Enter default OpenWeather key"
                variant="outlined"
                sx={fieldStyles}
              />
              <TextField
                fullWidth
                label="Finnhub API Key (Stocks)"
                type="password"
                value={localSettings.finnhubApiKey || ''}
                onChange={(e) => handleDefaultSettingChange('finnhubApiKey', e.target.value)}
                placeholder="Enter default Finnhub key"
                variant="outlined"
                sx={fieldStyles}
              />
              <TextField
                fullWidth
                label="API Ninjas Key (Holidays)"
                type="password"
                value={localSettings.apiNinjasApiKey || ''}
                onChange={(e) => handleDefaultSettingChange('apiNinjasApiKey', e.target.value)}
                placeholder="Enter your API Ninjas key"
                variant="outlined"
                sx={fieldStyles}
              />
              <Typography sx={{ color: '#999999', fontSize: '0.8rem' }}>
                <strong>News:</strong> Uses Currents API (primary) with Reddit API fallback. Up to 30 rotating headlines.
                <br />
                <strong>Other services:</strong> Defaults are used when adding new widgets or when widget-specific keys are left empty.
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            color: '#ffffff',
            borderColor: '#444444',
            '&:hover': { borderColor: '#555555', bgcolor: 'rgba(255,255,255,0.05)' },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{
            bgcolor: '#2196f3',
            color: '#ffffff',
            '&:hover': { bgcolor: '#1976d2' },
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};