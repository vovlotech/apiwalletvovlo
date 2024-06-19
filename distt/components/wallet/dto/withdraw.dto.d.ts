import { CoinNetworkDTO } from './coinNetwork.dto';
export declare class WithdrawDTO extends CoinNetworkDTO {
    address: string;
    amount: number;
}
export declare class SwapDTO extends CoinNetworkDTO {
    amount: number;
}
export declare class WithdrawFiatDTO {
    amount: number;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
}
