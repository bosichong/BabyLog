const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');
const photoRouter = require('../routes/photo');
const { auth, createApiTestContext } = require('./helpers/api-test-context');

const UPLOAD_ROOT = path.join(__dirname, '../uploads');

describe('Photo API', () => {
  let context;
  let tempDir;
  let sourceFile;
  const createdFiles = [];

  beforeAll(async () => {
    context = await createApiTestContext(photoRouter, '/v1/photos');
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'babylog-photo-test-'));
    sourceFile = path.join(tempDir, 'source.jpg');
    fs.writeFileSync(sourceFile, 'test image content');
  });

  afterAll(async () => {
    createdFiles.forEach((file) => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });
    if (fs.existsSync(sourceFile)) fs.unlinkSync(sourceFile);
    if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);
    await context.sequelize.close();
  });

  it('uploads an image', async () => {
    const res = await request(context.app)
      .post('/v1/photos/uploadfile')
      .set(auth(context.token))
      .attach('file', sourceFile);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toEqual(expect.objectContaining({
      file_name: expect.any(String),
      storage_path: expect.any(String),
      file_url: expect.any(String),
    }));

    createdFiles.push(path.join(UPLOAD_ROOT, res.body.data.storage_path));
  });

  it('rejects an upload without a file', async () => {
    const res = await request(context.app)
      .post('/v1/photos/uploadfile')
      .set(auth(context.token));

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      status: 'error',
      message: '没有上传文件',
    });
  });

  it('lists images', async () => {
    await context.models.Photo.create({
      file_name: 'listed.jpg',
      storage_path: 'test/listed.jpg',
      file_url: 'test/listed.jpg',
      user_id: context.user.id,
    });

    const res = await request(context.app)
      .get('/v1/photos')
      .set(auth(context.token));

    expect(res.status).toBe(200);
    expect(res.body.data.some((item) => item.file_name === 'listed.jpg')).toBe(true);
  });

  it('deletes an image by path', async () => {
    const relativePath = `test/delete-by-path-${Date.now()}.jpg`;
    const absolutePath = path.join(UPLOAD_ROOT, relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, 'delete me');
    createdFiles.push(absolutePath);

    await context.models.Photo.create({
      file_name: path.basename(relativePath),
      storage_path: relativePath,
      file_url: relativePath,
      user_id: context.user.id,
    });

    const res = await request(context.app)
      .post('/v1/photos/delete_img')
      .set(auth(context.token))
      .send({ photo_path: relativePath });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'success',
      data: { deleted: true },
    });
    expect(fs.existsSync(absolutePath)).toBe(false);
  });

  it('returns 404 when deleting a missing image path', async () => {
    const res = await request(context.app)
      .post('/v1/photos/delete_img')
      .set(auth(context.token))
      .send({ photo_path: 'missing/none.jpg' });

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      status: 'error',
      message: '文件不存在',
    });
  });

  it('deletes an image by id through the current action endpoint', async () => {
    const relativePath = `test/delete-by-id-${Date.now()}.jpg`;
    const absolutePath = path.join(UPLOAD_ROOT, relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, 'delete me');
    createdFiles.push(absolutePath);

    const photo = await context.models.Photo.create({
      file_name: path.basename(relativePath),
      storage_path: relativePath,
      file_url: relativePath,
      user_id: context.user.id,
    });

    const res = await request(context.app)
      .post(`/v1/photos/${photo.id}`)
      .set(auth(context.token));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(await context.models.Photo.findByPk(photo.id)).toBeNull();
    expect(fs.existsSync(absolutePath)).toBe(false);
  });

  it('returns 404 for an unknown image id', async () => {
    const res = await request(context.app)
      .post('/v1/photos/999999')
      .set(auth(context.token));

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      status: 'error',
      message: '照片不存在',
    });
  });

  it('requires authentication', async () => {
    const res = await request(context.app).get('/v1/photos');

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });
});
