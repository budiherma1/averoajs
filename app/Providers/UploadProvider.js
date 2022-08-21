import fs from 'fs';
import path from 'path';

const __dirname = path.resolve();

class UploadProvider {
  /**
   * [main method to upload file, please change the selection based on the choosen method]
   *
   * @param   {[object]}  file     [multer object]
   * @param   {[string]}  route    [route path]
   * @param   {[string]}  oldFile  [old file name]
   *
   * @return  {[string]}           [new saved file name]
   */
  async upload(file, route, oldFile = '') {
    const selection = await this.local(file, route, oldFile);
    return selection;
  }

  /**
   * [upload file on local storage]
   *
   * @param   {[object]}  file     [multer object]
   * @param   {[string]}  route    [route path]
   * @param   {[string]}  oldFile  [old file name]
   *
   * @return  {[string]}           [new saved file name]
   */
  async local(file, route, oldFile) {
    const fileName = `${new Date().getTime()}${file.originalname}`;
    const folder = path.join(__dirname, '/storages/upload/', route);

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder);
    }
    await fs.createWriteStream(path.join(folder, fileName)).write(file.buffer);

    if (oldFile) {
      fs.unlink(path.join(__dirname, '/storages/upload', oldFile), (err) => {
        if (err && err.code === 'ENOENT') {
          console.info("Error! File doesn't exist.");
        } else if (err) {
          console.error('Something went wrong. Please try again later.');
        } else {
          console.info('File successfully removed');
        }
      });
    }
    return `${route}/${fileName}`;
  }

  async awsS3(file, route, oldFile) {
    //
  }
}

export default new UploadProvider;
