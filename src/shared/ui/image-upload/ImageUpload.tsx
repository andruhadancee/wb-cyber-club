import { useState, useRef, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { API_BASE_URL } from '@/shared/api/config';

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  hint?: string;
}

async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${API_BASE_URL}/api/upload/image`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Ошибка загрузки');
  }

  const data = await res.json() as { url: string };
  return data.url;
}

async function deleteImage(url: string): Promise<void> {
  await fetch(`${API_BASE_URL}/api/upload/image`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  }).catch(() => {});
}

export function ImageUpload({ value, onChange, label = 'Изображение', hint }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [onChange]);

  const handleRemove = useCallback(() => {
    if (value) deleteImage(value);
    onChange(null);
  }, [value, onChange]);

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {label}
      </Typography>

      {value && (
        <Box
          sx={{
            position: 'relative',
            mb: 1,
            borderRadius: 1,
            overflow: 'hidden',
            maxHeight: 180,
            bgcolor: 'action.hover',
          }}
        >
          <Box
            component="img"
            src={value}
            alt="preview"
            sx={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }}
          />
          <IconButton
            size="small"
            color="error"
            onClick={handleRemove}
            disabled={uploading}
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'background.default' },
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {value ? 'Заменить' : 'Загрузить'}
        </Button>
        {hint && (
          <Typography variant="caption" color="text.secondary">
            {hint}
          </Typography>
        )}
      </Box>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
        hidden
        onChange={handleSelect}
      />
    </Box>
  );
}
