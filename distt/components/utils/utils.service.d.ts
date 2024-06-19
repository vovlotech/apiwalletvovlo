import { SendEmailDTO } from './dto/email.dto';
export declare class UtilsService {
    private mailgun;
    private mailgunClient;
    constructor();
    sendEmail(emailDto: SendEmailDTO): Promise<any>;
}
