import { Builder, WebDriver } from 'selenium-webdriver';
import { ServiceBuilder } from 'selenium-webdriver/chrome'
import chalk from 'chalk';

import { print } from "@/utils/PrintHelper";

import { CHROME_DRIVER_PATH } from '@/constants';
import BrowserTask, { BrowserTaskType } from './BrowserTask/BrowserTask';
import BrowserRefreshTask from './BrowserTask/RefreshTask';
import Wallet from './Wallet';

export default class Browser {
    public driver: WebDriver | undefined;
    private serviceBuilder: ServiceBuilder;
    public tasks: Array<BrowserTask> = [];

    constructor() {
        this.serviceBuilder = new ServiceBuilder(CHROME_DRIVER_PATH);
        print(chalk.green('SUCCESS: ') + chalk.magenta(`Use browser driver path: ${CHROME_DRIVER_PATH}`));
    }

    async prepareBrowser(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            this.driver = await new Builder()
                .forBrowser('chrome')
                .setChromeService(this.serviceBuilder)
                .build();

            print(chalk.green('SUCCESS: ') + chalk.magenta(`Web driver built.`));
            resolve();
        });
    }

    addTask(newTask: BrowserTask): void {
        const refreshTask = new BrowserRefreshTask();
        this.tasks.push(refreshTask);
        this.tasks.push(newTask);
    }

    runTasksInQueue(): void {
        setInterval(async () => {
            if (this.tasks.length === 0) {
                return;
            }

            const oldestTask = this.tasks[0];
            if (!oldestTask.isInProgress) {
                oldestTask.isInProgress = true;
                await oldestTask.start(this.driver!);
                oldestTask.isInProgress = false;
                oldestTask.isDone = true;
                this.tasks.shift();
            }
        }, 1000);
    }
}