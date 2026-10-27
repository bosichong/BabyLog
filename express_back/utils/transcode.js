const { spawn } = require('child_process');

/**
 * 视频转码工具
 *
 * 统一输出格式：mp4 容器 / H.264 (High profile) / yuv420p / AAC / faststart
 * yuv420p 是关键 —— 不指定会输出 4:4:4，Chrome 等浏览器无法解码。
 */

// 单次转码超时（毫秒）。500MB 视频按实测速度约 30-60 秒，留足余量
const TRANSCODE_TIMEOUT_MS = 10 * 60 * 1000;

function run(cmd, args, timeoutMs = TRANSCODE_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args);
    let stdout = '';
    let stderr = '';
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill('SIGKILL');
      reject(new Error(`${cmd} 超时（${Math.round(timeoutMs / 1000)}秒）`));
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
      if (stdout.length > 100000) stdout = stdout.slice(-50000);
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
      // 防止异常输出撑爆内存
      if (stderr.length > 20000) stderr = stderr.slice(-10000);
    });

    child.on('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error(`${cmd} 启动失败: ${err.message}`));
    });

    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${cmd} 退出码 ${code}: ${stderr.split('\n').filter(Boolean).slice(-3).join(' | ')}`));
    });
  });
}

/**
 * 读取视频元信息
 * @returns {Promise<{width:number|null, height:number|null, duration:number|null}>}
 */
async function probeVideo(filePath) {
  const { stdout } = await run('ffprobe', [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height:format=duration',
    '-of', 'json',
    filePath,
  ], 30000);

  const info = JSON.parse(stdout || '{}');
  const stream = info.streams && info.streams[0];
  const duration = info.format && info.format.duration;

  return {
    width: stream?.width ?? null,
    height: stream?.height ?? null,
    duration: duration ? Math.round(parseFloat(duration) * 100) / 100 : null,
  };
}

/**
 * 转码为浏览器通用格式
 * @param {string} inputPath  源文件
 * @param {string} outputPath 输出 mp4
 * @returns {Promise<{width:number|null, height:number|null, duration:number|null}>}
 */
async function transcodeToMp4(inputPath, outputPath) {
  await run('ffmpeg', [
    '-v', 'error',
    '-i', inputPath,
    // 视频：H.264 High + yuv420p（浏览器兼容的关键）
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    // 音频：AAC
    '-c:a', 'aac',
    '-b:a', '128k',
    // 最长边限制 1920，高度取偶数（H.264 要求）
    '-vf', "scale='min(1920,iw)':-2",
    // moov 前置，支持边下边播和拖进度
    '-movflags', '+faststart',
    '-y',
    outputPath,
  ]);

  return probeVideo(outputPath);
}

module.exports = {
  probeVideo,
  transcodeToMp4,
  TRANSCODE_TIMEOUT_MS,
};
