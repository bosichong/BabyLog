const request = require('supertest');
const blogRouter = require('../routes/blog');
const { auth, createApiTestContext } = require('./helpers/api-test-context');

function photoPayload(name) {
  return {
    file_name: name,
    storage_path: `2026/${name}`,
    file_url: `2026/${name}`,
  };
}

function videoPayload(name) {
  return {
    file_name: name,
    storage_path: `videos/2026/${name}`,
    file_url: `videos/2026/${name}`,
    duration: 12,
    size_bytes: 1024,
  };
}

describe('Blog API', () => {
  let context;

  beforeAll(async () => {
    context = await createApiTestContext(blogRouter, '/v1/blogs', {
      createBaby: true,
    });
  });

  afterAll(async () => {
    await context.sequelize.close();
  });

  it('searches blogs with pagination', async () => {
    const blog = await context.models.Blog.create({
      content: '搜索关键字日志',
      user_id: context.user.id,
    });
    await blog.setBabies([context.baby]);

    const res = await request(context.app)
      .post('/v1/blogs/search')
      .set(auth(context.token))
      .send({ page: 1, pageSize: 10, keyword: '搜索关键字' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    });
    expect(res.body.data.items[0].content).toBe('搜索关键字日志');
  });

  it('gets a blog by id', async () => {
    const blog = await context.models.Blog.create({
      content: '详情日志',
      user_id: context.user.id,
    });
    await blog.setBabies([context.baby]);

    const res = await request(context.app)
      .get(`/v1/blogs/${blog.id}`)
      .set(auth(context.token));

    expect(res.status).toBe(200);
    expect(res.body.data.content).toBe('详情日志');
    expect(res.body.data.babies).toHaveLength(1);
  });

  it('returns 404 for an unknown blog', async () => {
    const res = await request(context.app)
      .get('/v1/blogs/999999')
      .set(auth(context.token));

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      status: 'error',
      message: '博客不存在',
    });
  });

  it('creates a blog with a photo and video', async () => {
    const res = await request(context.app)
      .post('/v1/blogs')
      .set(auth(context.token))
      .send({
        content: '新建带媒体日志',
        baby_ids: [context.baby.id],
        photo_ids: [photoPayload('create-photo.jpg')],
        video: videoPayload('create-video.mp4'),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.content).toBe('新建带媒体日志');
    expect(res.body.data.babies).toHaveLength(1);
    expect(res.body.data.photos).toHaveLength(1);
    expect(res.body.data.video.storage_path).toBe('videos/2026/create-video.mp4');
  });

  it('adds photos and video while editing', async () => {
    const blog = await context.models.Blog.create({
      content: '待补充媒体',
      user_id: context.user.id,
    });
    await blog.setBabies([context.baby]);

    const res = await request(context.app)
      .post(`/v1/blogs/${blog.id}/update`)
      .set(auth(context.token))
      .send({
        content: '已补充媒体',
        baby_ids: [context.baby.id],
        photo_ids: [photoPayload('edit-photo.jpg')],
        video: videoPayload('edit-video.mp4'),
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.photos).toHaveLength(1);
    expect(res.body.data.video.storage_path).toBe('videos/2026/edit-video.mp4');

    const savedPhoto = await context.models.Photo.findOne({
      where: { storage_path: '2026/edit-photo.jpg' },
    });
    expect(savedPhoto.blog_id).toBe(blog.id);
  });

  it('replaces the existing video while editing', async () => {
    const blog = await context.models.Blog.create({
      content: '待替换视频',
      user_id: context.user.id,
    });
    await blog.setBabies([context.baby]);
    await context.models.Video.create({
      ...videoPayload('first-video.mp4'),
      blog_id: blog.id,
      user_id: context.user.id,
    });

    const res = await request(context.app)
      .post(`/v1/blogs/${blog.id}/update`)
      .set(auth(context.token))
      .send({
        content: '已替换视频',
        baby_ids: [context.baby.id],
        photo_ids: [],
        video: videoPayload('second-video.mp4'),
      });

    expect(res.status).toBe(200);
    expect(res.body.data.video.storage_path).toBe('videos/2026/second-video.mp4');

    const videos = await context.models.Video.findAll({ where: { blog_id: blog.id } });
    expect(videos).toHaveLength(1);
    expect(videos[0].storage_path).toBe('videos/2026/second-video.mp4');
  });

  it('returns a detailed reason when editing fails', async () => {
    const blog = await context.models.Blog.create({
      content: '用于验证失败原因',
      user_id: context.user.id,
    });
    await blog.setBabies([context.baby]);

    const res = await request(context.app)
      .post(`/v1/blogs/${blog.id}/update`)
      .set(auth(context.token))
      .send({
        content: '测试失败原因',
        baby_ids: [context.baby.id],
        photo_ids: [null],
      });

    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({
      status: 'error',
      message: '更新博客失败',
    });
    expect(res.body.reason).toContain('storage_path');
  });

  it('validates required blog content', async () => {
    const res = await request(context.app)
      .post('/v1/blogs')
      .set(auth(context.token))
      .send({ content: '', baby_ids: [context.baby.id] });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      status: 'error',
      message: '博客内容不能为空',
    });

    const updateRes = await request(context.app)
      .post('/v1/blogs/1/update')
      .set(auth(context.token))
      .send({ content: '', baby_ids: [context.baby.id] });

    expect(updateRes.status).toBe(400);
    expect(updateRes.body).toMatchObject({
      status: 'error',
      message: '博客内容不能为空',
    });
  });

  it('deletes a blog and its associated media', async () => {
    const blog = await context.models.Blog.create({
      content: '待删除带媒体日志',
      user_id: context.user.id,
    });
    await blog.setBabies([context.baby]);
    const photo = await context.models.Photo.create({
      ...photoPayload('delete-photo.jpg'),
      blog_id: blog.id,
      user_id: context.user.id,
    });
    const video = await context.models.Video.create({
      ...videoPayload('delete-video.mp4'),
      blog_id: blog.id,
      user_id: context.user.id,
    });

    const res = await request(context.app)
      .delete(`/v1/blogs/${blog.id}`)
      .set(auth(context.token));

    expect(res.status).toBe(204);
    expect(await context.models.Blog.findByPk(blog.id)).toBeNull();
    expect(await context.models.Photo.findByPk(photo.id)).toBeNull();
    expect(await context.models.Video.findByPk(video.id)).toBeNull();
  });

  it('returns blogs from the same day in previous years', async () => {
    const now = new Date();
    const previousYear = new Date(now);
    previousYear.setFullYear(now.getFullYear() - 1);

    await context.models.Blog.create({
      content: '往年今天日志',
      user_id: context.user.id,
      created_at: previousYear,
      updated_at: previousYear,
    });

    const res = await request(context.app)
      .get('/v1/blogs/memories/today')
      .set(auth(context.token));

    expect(res.status).toBe(200);
    expect(res.body.data.some((item) => item.content === '往年今天日志')).toBe(true);
  });

  it('requires authentication', async () => {
    const res = await request(context.app).post('/v1/blogs/search').send({});

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });
});
