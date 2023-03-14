import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
    path: path.join(__dirname, '../.env')
});

enum Environments {
    local = 'LOCAL',
    prod = 'PROD',
}

class Environment {
    private readonly environment: Environments;

    constructor(environment: Environments) {
        this.environment = environment;
    }

    get port(): number {
        return this.environment === Environments.local ? 3000 : 9001;
    }

    get awsAccessKeyId(): string {
        return process.env.AWS_ACCESS_KEY_ID as string;
    }

    get awsSecretAccessKey(): string {
        return process.env.AWS_SECRET_ACCESS_KEY as string;
    }
}

export default new Environment(process.env.ENVIRONMENT as Environments);