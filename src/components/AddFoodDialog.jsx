import { useEffect, useState } from 'react';
import {
    Alert, Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
    FormControlLabel, IconButton, InputAdornment, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import API from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';

const MEALS = [
    { key: 'BREAKFAST', label: 'Breakfast' },
    { key: 'LUNCH', label: 'Lunch' },
    { key: 'DINNER', label: 'Dinner' },
    { key: 'SNACK', label: 'Snacks' },
];

const round = (value) => Math.round(value * 10) / 10;
const toNumber = (value) => (value === '' || value == null ? null : Number(value));

/** Search the food catalog or describe a food yourself, then log it to a meal. */
function AddFoodDialog({ open, date, meal: initialMeal, onClose, onAdded }) {
    const { theme } = useAppTheme();
    const [tab, setTab] = useState(0);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selected, setSelected] = useState(null);
    const [servings, setServings] = useState(1);
    const [meal, setMeal] = useState(initialMeal);
    const [custom, setCustom] = useState({ name: '', servingLabel: '1 serving', calories: '', proteinG: '', carbsG: '', fatG: '' });
    const [saveCustom, setSaveCustom] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    // Empty search shows the foods this user logged most recently.
    useEffect(() => {
        let ignore = false;
        const timer = setTimeout(() => {
            setSearching(true);
            API.get('/foods', { params: { q: query.trim() || undefined } })
                .then((res) => { if (!ignore) setResults(res.data); })
                .catch((err) => { if (!ignore) setError(errorMessage(err, 'Food search failed')); })
                .finally(() => { if (!ignore) setSearching(false); });
        }, query ? 300 : 0);
        return () => { ignore = true; clearTimeout(timer); };
    }, [query]);

    const amount = Number(servings) || 0;
    const customTotals = {
        calories: round((toNumber(custom.calories) || 0) * amount),
        proteinG: round((toNumber(custom.proteinG) || 0) * amount),
        carbsG: round((toNumber(custom.carbsG) || 0) * amount),
        fatG: round((toNumber(custom.fatG) || 0) * amount),
    };
    const canSubmit = amount >= 0.1 && amount <= 50 && (tab === 0
        ? !!selected
        : custom.name.trim() !== '' && custom.servingLabel.trim() !== '' && custom.calories !== '');

    const submit = async () => {
        setError('');
        setSaving(true);
        try {
            const body = tab === 0
                ? { date, meal, foodId: selected.id, servings: amount }
                : {
                    date, meal, servings: amount, saveCustomFood: saveCustom,
                    customFood: {
                        name: custom.name.trim(),
                        servingLabel: custom.servingLabel.trim(),
                        calories: toNumber(custom.calories) || 0,
                        proteinG: toNumber(custom.proteinG) || 0,
                        carbsG: toNumber(custom.carbsG) || 0,
                        fatG: toNumber(custom.fatG) || 0,
                    },
                };
            const res = await API.post('/nutrition/diary', body);
            onAdded(res.data);
        } catch (err) {
            setError(errorMessage(err, 'Could not add this food'));
            setSaving(false);
        }
    };

    const fieldStyle = {
        '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: theme.mix(0.2) } },
        '& .MuiInputLabel-root': { color: theme.mix(0.5) },
        '& .MuiInputBase-input': { color: theme.mix(1) },
        '& .MuiFormHelperText-root': { color: theme.mix(0.4) },
    };

    const stepServings = (delta) => setServings((current) => {
        const next = Math.round((Number(current) + delta) * 100) / 100;
        return Math.min(50, Math.max(0.1, next));
    });

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm"
                slotProps={{ paper: { sx: { background: theme.menuBg, color: theme.mix(1), borderRadius: 3, fontFamily: "'Poppins', sans-serif" } } }}>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Add food</DialogTitle>
            <DialogContent dividers sx={{ borderColor: theme.mix(0.1) }}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    {MEALS.map((m) => (
                        <Chip key={m.key} label={m.label} onClick={() => setMeal(m.key)}
                              sx={{
                                  fontWeight: 600, cursor: 'pointer',
                                  background: meal === m.key ? '#e94560' : theme.mix(0.08),
                                  color: meal === m.key ? '#fff' : theme.mix(0.8),
                              }} />
                    ))}
                </Box>

                <Tabs value={tab} onChange={(e, value) => setTab(value)} sx={{
                    mb: 2, minHeight: 36,
                    '& .MuiTab-root': { color: theme.mix(0.5), textTransform: 'none', fontWeight: 600, minHeight: 36 },
                    '& .Mui-selected': { color: '#e94560 !important' },
                    '& .MuiTabs-indicator': { background: '#e94560' },
                }}>
                    <Tab label="Search foods" />
                    <Tab label="Enter my own" />
                </Tabs>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {tab === 0 ? (
                    <>
                        <TextField fullWidth autoFocus placeholder="Search foods, e.g. rice, chapati, banana"
                                   value={query} onChange={(e) => setQuery(e.target.value)} sx={fieldStyle}
                                   slotProps={{
                                       input: {
                                           startAdornment: (
                                               <InputAdornment position="start">
                                                   {searching ? <CircularProgress size={18} /> : <SearchIcon sx={{ color: theme.mix(0.4) }} />}
                                               </InputAdornment>
                                           ),
                                       },
                                   }} />

                        <Typography sx={{ color: theme.mix(0.45), fontSize: '0.75rem', mt: 1.5, mb: 0.5 }}>
                            {query.trim()
                                ? `${results.length} result${results.length === 1 ? '' : 's'}`
                                : results.length > 0 ? 'Recently logged' : 'Start typing to search the food list'}
                        </Typography>

                        <Box sx={{ maxHeight: 260, overflowY: 'auto' }}>
                            {results.map((food) => (
                                <Box key={food.id} onClick={() => setSelected(food)} sx={{
                                    p: 1.2, mb: 0.75, borderRadius: 2, cursor: 'pointer',
                                    border: `1px solid ${selected?.id === food.id ? '#e94560' : theme.mix(0.1)}`,
                                    background: selected?.id === food.id ? 'rgba(233,69,96,0.12)' : 'transparent',
                                    '&:hover': { background: theme.mix(0.05) },
                                }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                                        <Typography sx={{ color: theme.mix(1), fontWeight: 600, fontSize: '0.9rem' }}>
                                            {food.name}{food.custom ? ' (mine)' : ''}
                                        </Typography>
                                        <Typography sx={{ color: '#ffa726', fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                            {Math.round(food.calories)} kcal
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ color: theme.mix(0.45), fontSize: '0.75rem' }}>
                                        {food.servingLabel} · P {food.proteinG} g · C {food.carbsG} g · F {food.fatG} g
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </>
                ) : (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                        <TextField label="Food name" value={custom.name} sx={{ ...fieldStyle, gridColumn: { sm: '1 / -1' } }}
                                   onChange={(e) => setCustom({ ...custom, name: e.target.value })} required />
                        <TextField label="One serving is" value={custom.servingLabel} sx={fieldStyle}
                                   onChange={(e) => setCustom({ ...custom, servingLabel: e.target.value })}
                                   helperText="e.g. 1 plate, 100 g" required />
                        <TextField label="Calories per serving" type="number" value={custom.calories} sx={fieldStyle}
                                   onChange={(e) => setCustom({ ...custom, calories: e.target.value })} required />
                        <TextField label="Protein (g)" type="number" value={custom.proteinG} sx={fieldStyle}
                                   onChange={(e) => setCustom({ ...custom, proteinG: e.target.value })} />
                        <TextField label="Carbs (g)" type="number" value={custom.carbsG} sx={fieldStyle}
                                   onChange={(e) => setCustom({ ...custom, carbsG: e.target.value })} />
                        <TextField label="Fat (g)" type="number" value={custom.fatG} sx={fieldStyle}
                                   onChange={(e) => setCustom({ ...custom, fatG: e.target.value })} />
                        <FormControlLabel sx={{ gridColumn: { sm: '1 / -1' }, color: theme.mix(0.7) }}
                                          control={<Checkbox checked={saveCustom} onChange={(e) => setSaveCustom(e.target.checked)} sx={{ color: theme.mix(0.4) }} />}
                                          label="Save this food so I can log it again" />
                    </Box>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2.5, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton onClick={() => stepServings(-0.5)} sx={{ color: theme.mix(0.6) }} aria-label="Fewer servings">
                            <RemoveIcon />
                        </IconButton>
                        <TextField label="Servings" type="number" value={servings} sx={{ ...fieldStyle, width: 110 }}
                                   onChange={(e) => setServings(e.target.value)} />
                        <IconButton onClick={() => stepServings(0.5)} sx={{ color: theme.mix(0.6) }} aria-label="More servings">
                            <AddIcon />
                        </IconButton>
                    </Box>
                    <Box>
                        {tab === 0 && selected && (
                            <Typography sx={{ color: theme.mix(0.7), fontSize: '0.85rem' }}>
                                {selected.name}: <strong>{Math.round(selected.calories * amount)} kcal</strong>
                                {' '}· P {round(selected.proteinG * amount)} g · C {round(selected.carbsG * amount)} g · F {round(selected.fatG * amount)} g
                            </Typography>
                        )}
                        {tab === 1 && custom.calories !== '' && (
                            <Typography sx={{ color: theme.mix(0.7), fontSize: '0.85rem' }}>
                                Total: <strong>{Math.round(customTotals.calories)} kcal</strong>
                                {' '}· P {customTotals.proteinG} g · C {customTotals.carbsG} g · F {customTotals.fatG} g
                            </Typography>
                        )}
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} sx={{ color: theme.mix(0.6), textTransform: 'none' }}>Cancel</Button>
                <Button variant="contained" onClick={submit} disabled={!canSubmit || saving}
                        sx={{ borderRadius: 999, px: 3, textTransform: 'none', fontWeight: 700, background: 'linear-gradient(90deg, #e94560, #ff6b35)' }}>
                    {saving ? <CircularProgress size={22} color="inherit" /> : 'Add to diary'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AddFoodDialog;
