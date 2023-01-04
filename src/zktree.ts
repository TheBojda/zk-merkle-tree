import { buildMimcSponge } from 'circomlibjs'

class ZKTree {

    private mimc: any
    private levels: number
    private capacity: number

    constructor(levels: number) {
        this.levels = levels
        this.capacity = 2 ** levels
    }

    private async init() {
        if (this.mimc)
            return
        this.mimc = await buildMimcSponge();
    }



}