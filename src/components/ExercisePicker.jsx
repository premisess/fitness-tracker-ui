import { useEffect, useState } from 'react';
import { Autocomplete, Box, TextField, Typography } from '@mui/material';
import API from '../services/api';

/** Search-as-you-type picker over the exercise library. Calls onSelect with the chosen exercise. */
function ExercisePicker({ onSelect, theme, excludeIds = [], label = 'Add an exercise' }) {
    const [input, setInput] = useState('');
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let ignore = false;
        const id = setTimeout(async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({ size: '15' });
                if (input.trim()) params.set('q', input.trim());
                const res = await API.get(`/exercises?${params}`);
                if (!ignore) setOptions(res.data.items);
            } catch {
                if (!ignore) setOptions([]);
            } finally {
                if (!ignore) setLoading(false);
            }
        }, 250);
        return () => { ignore = true; clearTimeout(id); };
    }, [input]);

    return (
        <Autocomplete
            value={null}
            options={options}
            loading={loading}
            inputValue={input}
            onInputChange={(e, value, reason) => { if (reason !== 'reset') setInput(value); }}
            onChange={(e, option) => { if (option) { onSelect(option); setInput(''); } }}
            filterOptions={(x) => x}
            getOptionLabel={(option) => option.name}
            getOptionDisabled={(option) => excludeIds.includes(option.id)}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            noOptionsText={input ? 'No matching exercises' : 'Start typing to search'}
            slotProps={{ paper: { sx: { background: theme.menuBg, color: theme.mix(1) } } }}
            renderOption={(props, option) => {
                const { key, ...rest } = props;
                return (
                    <Box component="li" key={key} {...rest} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        {option.imageUrls?.[0]
                            ? <Box component="img" src={option.imageUrls[0]} alt="" loading="lazy"
                                   sx={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 1, background: '#fff', flexShrink: 0 }} />
                            : <Box sx={{ width: 44, height: 44, borderRadius: 1, background: theme.mix(0.1), flexShrink: 0 }} />}
                        <Box>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>{option.name}</Typography>
                            <Typography sx={{ fontSize: '0.72rem', color: theme.mix(0.5) }}>
                                {[option.category, option.primaryMuscles?.join(', '), option.equipment].filter(Boolean).join(' · ')}
                            </Typography>
                        </Box>
                    </Box>
                );
            }}
            renderInput={(params) => (
                <TextField {...params} label={label} placeholder="e.g. bench press, squat, plank"
                           sx={{
                               '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: theme.mix(0.2) } },
                               '& .MuiInputLabel-root': { color: theme.mix(0.5) },
                               '& .MuiInputBase-input': { color: theme.mix(1) },
                           }} />
            )}
        />
    );
}

export default ExercisePicker;
