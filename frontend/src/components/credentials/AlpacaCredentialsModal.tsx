import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
  Box,
  Typography,
} from '@mui/material';
import apiService from '../../services/apiService';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (mode: string) => void;
}

const AlpacaCredentialsModal: React.FC<Props> = ({ open, onClose, onSuccess }) => {
  const [environment, setEnvironment] = useState<'paper' | 'live'>('paper');
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [persist, setPersist] = useState(true);
  const [encrypt, setEncrypt] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    setResultMsg(null);
    try {
      const resp = await apiService.injectAlpacaCredentials({
        environment,
        api_key: apiKey.trim(),
        secret_key: secretKey.trim(),
        persist,
        encrypt,
      });
      if (resp.success && resp.data) {
        setResultMsg(
          `Credentials applied. Mode: ${resp.data.mode}${resp.data.persisted ? ' (persisted)' : ''}`
        );
        onSuccess(resp.data.mode || '');
        try {
          window.dispatchEvent(
            new CustomEvent('alpaca:credentials_applied', { detail: resp.data })
          );
        } catch {}
        // Optionally close after short delay
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(resp.error || 'Failed to apply credentials');
      }
    } catch (e: any) {
      setError(e.message || 'Unexpected error');
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = submitting || !apiKey || !secretKey;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Connect Alpaca Brokerage</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Enter your Alpaca API credentials. They stay local to your backend. Live trading requires
          explicit enablement server-side.
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Environment
          </Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={environment}
            onChange={(_, val) => val && setEnvironment(val)}
            sx={{ mt: 1 }}
          >
            <ToggleButton value="paper">Paper</ToggleButton>
            <ToggleButton value="live">Live</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <TextField
          label="API Key"
          fullWidth
          margin="dense"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          autoComplete="off"
        />
        <TextField
          label="Secret Key"
          fullWidth
          margin="dense"
          value={secretKey}
          onChange={(e) => setSecretKey(e.target.value)}
          autoComplete="off"
          type="password"
        />

        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <FormControlLabel
            control={<Switch checked={persist} onChange={(e) => setPersist(e.target.checked)} />}
            label="Persist (.env)"
          />
          <FormControlLabel
            control={
              <Switch
                checked={encrypt}
                disabled={!persist}
                onChange={(e) => setEncrypt(e.target.checked)}
              />
            }
            label="Encrypt"
          />
        </Box>
        <Typography variant="caption" color="text.secondary">
          {persist
            ? encrypt
              ? 'Stored encrypted with master key (provide ALPACA_CRED_MASTER_KEY to decrypt on restart).'
              : 'Stored in plain text (development only).'
            : 'Will be kept in memory until service restarts.'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {resultMsg && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {resultMsg}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={disabled} variant="contained">
          {submitting ? 'Applying...' : 'Apply'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AlpacaCredentialsModal;
