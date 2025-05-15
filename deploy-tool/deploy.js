/**
 * Node.js 部署脚本
 * 请先安装依赖: npm install node-ssh ora chalk inquirer
 */

const { exec } = require('child_process');
const { NodeSSH } = require('node-ssh');
const ora = require('ora');
const chalk = require('chalk');

// 配置信息
const config = {
  server: {
    host: '116.62.207.73',
    username: 'root',
    // 删除硬编码的密码
  },
  remotePath: '/root/server-projects/mengniu_server'
};

// 执行命令的Promise封装
function execCommand(command) {
  return new Promise((resolve, reject) => {
    // 在上级目录执行命令
    exec(`cd .. && ${command}`, (error, stdout, stderr) => {
      if (error) {
        console.error(chalk.red(`执行错误: ${error}`));
        return reject(error);
      }
      console.log(stdout);
      if (stderr) console.error(chalk.yellow(stderr));
      resolve(stdout);
    });
  });
}

// 构建应用
async function buildApp() {
  const spinner = ora('安装依赖...').start();
  try {
    await execCommand('npm ci');
    spinner.succeed('依赖安装完成');

    spinner.text = '构建应用...';
    spinner.start();
    await execCommand('npm run build');
    spinner.succeed('构建完成');
    return true;
  } catch (error) {
    spinner.fail(`构建失败: ${error.message}`);
    return false;
  }
}

// 获取用户密码
async function getPassword() {
  // 动态导入 inquirer (ESM 模块)
  const { default: inquirer } = await import('inquirer');
  
  const answers = await inquirer.prompt([
    {
      type: 'password',
      name: 'password',
      message: '请输入服务器密码:',
      mask: '*'
    }
  ]);
  return answers.password;
}

// 部署应用
async function deployApp() {
  const spinner = ora('准备连接到服务器...').start();
  const ssh = new NodeSSH();

  try {
    // 获取用户输入的密码
    spinner.stop();
    const password = await getPassword();
    spinner.text = '连接到服务器...';
    spinner.start();

    // 使用用户输入的密码连接
    await ssh.connect({
      ...config.server,
      password
    });
    
    spinner.succeed('服务器连接成功');

    spinner.text = '执行远程部署命令...';
    spinner.start();
    
    // 执行远程命令
    await ssh.execCommand(`cd ${config.remotePath} && git pull`, { stream: 'stdout' });
    await ssh.execCommand(`cd ${config.remotePath} && docker-compose down`, { stream: 'stdout' });
    await ssh.execCommand(`cd ${config.remotePath} && docker-compose up -d --build`, { stream: 'stdout' });
    
    spinner.succeed('远程部署完成');
    ssh.dispose();
    return true;
  } catch (error) {
    spinner.fail(`部署失败: ${error.message}`);
    ssh.dispose();
    return false;
  }
}

// 主函数
async function main() {
  console.log(chalk.green('===> 开始构建和部署流程 <==='));
  
  // const buildSuccess = await buildApp();
  // if (!buildSuccess) {
  //   console.log(chalk.red('构建失败，停止部署'));
  //   return;
  // }
  
  const deploySuccess = await deployApp();
  if (deploySuccess) {
    console.log(chalk.green('===> 部署完成 <==='));
  } else {
    console.log(chalk.red('===> 部署失败 <==='));
  }
}

// 执行主函数
main().catch(error => {
  console.error(chalk.red(`执行错误: ${error.message}`));
  process.exit(1);
});