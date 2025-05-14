module.exports = {
  apps: [{
    name: 'backend',
    script: 'dist/main.js',
    instances: process.env.PM2_INSTANCES || 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: process.env.PM2_MAX_MEMORY_RESTART || '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 3000
    },
    // Docker中PM2的特殊配置
    exp_backoff_restart_delay: 100, // 自动重启的延迟时间
    merge_logs: true, // 合并集群实例的日志
    log_date_format: 'YYYY-MM-DD HH:mm:ss', // 日志的日期格式
    // 在Docker中我们希望能够正确处理信号
    kill_timeout: 3000, // 给进程发送SIGKILL信号前的等待时间
    wait_ready: true, // 等待进程发送ready信号
  }]
}; 