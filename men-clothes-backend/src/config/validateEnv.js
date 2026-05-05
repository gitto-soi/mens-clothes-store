import envalid from 'envalid';
const { str, num, url } = envalid;

export const validateEnv = () => {
  envalid.cleanEnv(process.env, {
    DATABASE_URL: url(),
    JWT_SECRET: str(),
    PORT: num({ default: 5000 }),
    CLIENT_URL: str(),
    CLOUDINARY_CLOUD_NAME: str(),
    CLOUDINARY_API_KEY: str(),
    CLOUDINARY_API_SECRET: str(),
    BAKONG_ACCOUNT_USERNAME: str(),
    BAKONG_ACCOUNT_NAME: str(),
    BAKONG_LOCATION: str(),
    BAKONG_PHONE_NUMBER: str(),
    BAKONG_TOKEN: str(),
    NBC_API_URL: url({ default: 'https://api-bakong.nbc.gov.kh/' }),
    NODE_ENV: str({ default: 'development' }),
  });
};