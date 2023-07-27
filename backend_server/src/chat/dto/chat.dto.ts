export class chatGetProfileDto {
    constructor(targetNickname: string, img: string, rate: number, historics: string[], isOnline: boolean) {
        this.targetNickname = targetNickname;
        this.img = img;
        this.rate = rate;
        this.historics = historics;
        this.isOnline = isOnline;
    }
    
    targetNickname: string;
    img: string;
    rate: number;
    historics: string[]; // Game obj
    isOnline: boolean;
};