// Shared labels and colours for goals and workout plans.

export const GOAL_COLORS = {
    LOSE_WEIGHT: '#e94560',
    GAIN_WEIGHT: '#ff6b35',
    BUILD_STRENGTH: '#4ecdc4',
    RUN_MORE: '#45b7d1',
    STAY_ACTIVE: '#a29bfe',
};

export const GOAL_LABELS = {
    LOSE_WEIGHT: 'Lose weight',
    GAIN_WEIGHT: 'Gain weight',
    BUILD_STRENGTH: 'Build strength',
    RUN_MORE: 'Run more',
    STAY_ACTIVE: 'Stay active',
};

/** Where a plan session is logged: GPS runs in the run tracker, everything else in the workout log. */
export const sessionPath = (session) => (session.activity === 'RUN' ? '/run?planSession=1' : '/workouts?planSession=1');
