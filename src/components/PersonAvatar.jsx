import { Avatar } from '@mui/material';
import { avatarColor, pictureUrl } from '../utils/people';

/** A person's photo, or their initial on a colour from the app's palette. */
function PersonAvatar({ person, size = 40 }) {
    return (
        <Avatar src={pictureUrl(person.picture)} alt={person.name}
                sx={{ width: size, height: size, bgcolor: avatarColor(person.id), fontWeight: 700, fontSize: size * 0.42 }}>
            {person.name?.charAt(0).toUpperCase()}
        </Avatar>
    );
}

export default PersonAvatar;
