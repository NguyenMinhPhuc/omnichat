module.exports = {
    apps: [
        {
            name: 'OmniChat',
            cwd: '/home/fitlhu-omnichat/htdocs/omnichat.fitlhu.com/omnichat',
            script: 'node_modules/next/dist/bin/next',
            args: 'start -p 3033',
            env: {
                NODE_ENV: 'production'
            }
        }
    ]
};