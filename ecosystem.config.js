module.exports = {
  apps: [
    {
      name: "badminton-world",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: "./",
      instances: 2, // Cluster mode with 2 instances
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 4000,
    },
  ],
}
