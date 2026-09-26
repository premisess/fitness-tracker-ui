import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupsIcon from '@mui/icons-material/Groups';

/** Message kinds that show as highlighted alerts, with the text they start from. */
export const ALERT_KINDS = {
    CHALLENGE: {
        title: 'Challenge',
        Icon: EmojiEventsIcon,
        color: '#ffa726',
        template: 'I challenge you to beat my workout minutes this week. Most minutes by Sunday wins.',
    },
    COLLAB: {
        title: 'Train together',
        Icon: GroupsIcon,
        color: '#4ecdc4',
        template: "Want to train together this week? Let's pick a day and push each other.",
    },
};
