const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');

jest.mock('../utils/transcode', () => ({
  transcodeToMp4: async (inputPath, outputPath) => {
    require('fs').copyFileSync(inputPath, outputPath);
    return { duration: 2.5, width: 1280, height: 720 };
  },
}));

const videoRouter = require('../routes/video');
const { auth, createApiTestContext } = require('./helpers/api-test-context');

const UPLOAD_ROOT = path.join(__dirname, '../uploads');

describe('Video API', () => {
  let context;
  let tempDir;
  let sourceFile;
  let uploadedFile;

  beforeAll(async () => {
    context = await createApiTestContext(videoRouter, '/v1/videos');
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'babylog-video-test-'));
    sourceFile = path.join(tempDir, 'source.mp4');
    fs.writeFileSync(sourceFile, 'fake video content');
  });

  afterAll(async () => {
    if (uploadedFile && fs.existsSync(uploadedFile)) fs.unlinkSync(uploadedFile);
    if (fs.existsSync(sourceFile)) fs.unlinkSync(sourceFile);
    if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);
    await context.sequelize.close();
  });

  it('uploads and transcodes a video', async () => {
    const res = await request(context.app)
      .post('/v1/videos/uploadfile')
      .set(auth(context.token))
      .attach('file', sourceFile, { contentType: 'video/mp4' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toEqual(expect.objectContaining({
      file_name: expect.stringMatching(/\.mp4$/),
      storage_path: expect.stringMatching(/^videos\//),
      duration: 2.5,
      width: 1280,
      height: 720,
    }));

    uploadedFile = path.join(UPLOAD_ROOT, res.body.data.storage_path);
    expect(fs.existsSync(uploadedFile)).toBe(true);
  });

  it('rejects an upload without a file', async () => {
    const res = await request(context.app)
      .post('/v1/videos/uploadfile')
      .set(auth(context.token));

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      status: 'error',
      message: '没有上传文件',
    });
  });

  it('rejects a non-video upload', async () => {
    const res = await request(context.app)
      .post('/v1/videos/uploadfile')
      .set(auth(context.token))
      .attach('file', sourceFile, { contentType: 'text/plain' });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      status: 'error',
      message: '只支持上传视频文件',
    });
  });

  it('rejects a missing video path', async () => {
    const res = await request(context.app)
      .post('/v1/videos/delete')
      .set(auth(context.token))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      status: 'error',
      message: '缺少 video_path',
    });
  });

  it('rejects a path outside the video directory', async () => {
    const res = await request(context.app)
      .post('/v1/videos/delete')
      .set(auth(context.token))
      .send({ video_path: '../outside.mp4' });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      status: 'error',
      message: '非法路径',
    });
  });

  it('returns 404 when deleting a missing video', async () => {
    const res = await request(context.app)
      .post('/v1/videos/delete')
      .set(auth(context.token))
      .send({ video_path: 'videos/2099/missing.mp4' });

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      status: 'error',
      message: '文件不存在',
    });
  });

  it('deletes an uploaded video', async () => {
    const storagePath = path.relative(UPLOAD_ROOT, uploadedFile).split(path.sep).join('/');
    const res = await request(context.app)
      .post('/v1/videos/delete')
      .set(auth(context.token))
      .send({ video_path: storagePath });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'success',
      data: { deleted: true },
    });
    expect(fs.existsSync(uploadedFile)).toBe(false);
  });

  it('requires authentication', async () => {
    const res = await request(context.app).post('/v1/videos/delete').send({});

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });
});
