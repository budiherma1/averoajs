import crypto from 'crypto';

const exec = () => {
  console.log(crypto.randomBytes(64).toString('hex'));
};

export default exec();
