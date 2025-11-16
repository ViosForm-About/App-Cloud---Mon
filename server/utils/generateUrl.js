import { v4 as uuidv4 } from 'uuid';

export const generateStandardUrl = (fileExtension) => {
    const fileId = uuidv4().substr(0, 8);
    return `${process.env.CLOUDMON_URL}/${fileId}${fileExtension}`;
};

export const generateCustomUrl = (customName, fileExtension) => {
    const fileId = uuidv4().substr(0, 6);
    // Clean custom name - only allow letters, numbers, dash
    const cleanName = customName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    
    return `${process.env.CLOUDMON_URL}/${cleanName}/${fileId}${fileExtension}`;
};

export const generateFileId = () => {
    return uuidv4().substr(0, 8);
};

export const validateCustomName = (name) => {
    if (!name || name.length < 3 || name.length > 30) {
        return false;
    }
    
    const regex = /^[a-zA-Z0-9-]+$/;
    return regex.test(name);
};