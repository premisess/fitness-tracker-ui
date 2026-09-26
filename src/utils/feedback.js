import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';

/** What a user can send, with its colour and the hint shown in the message box. */
export const FEEDBACK_KINDS = {
    FEEDBACK: { label: 'Feedback', Icon: ChatOutlinedIcon, color: '#45b7d1', hint: 'Tell us what you like, or what could be better.' },
    RECOMMENDATION: { label: 'Recommendation', Icon: LightbulbOutlinedIcon, color: '#ffd166', hint: 'Suggest a feature or an improvement you would like to see.' },
    PROBLEM: { label: 'Problem', Icon: BugReportOutlinedIcon, color: '#e94560', hint: 'Tell us what went wrong and on which page, so we can fix it.' },
};

export const FEEDBACK_STATUSES = {
    NEW: { label: 'Sent', color: '#45b7d1' },
    REVIEWED: { label: 'Reviewed', color: '#a29bfe' },
    PLANNED: { label: 'Planned', color: '#ffa726' },
    DONE: { label: 'Done', color: '#4ecdc4' },
};
