export class History {
    private size: number;
    private entries: string[];
    private cursor: number;
    constructor(size: number) {
        this.size = size
        this.entries = []
        this.cursor = 0
    }

    push(entry: string) {
        if (entry.trim() === "") return
        const lastEntry = this.entries[this.entries.length - 1]
        if (entry === lastEntry) return

        this.entries.push(entry)
        if (this.entries.length > this.size) {
            this.entries.pop()
        }
        this.cursor = this.entries.length
    }

    rewind() {
        this.cursor = this.entries.length
    }

    getPrevious(): string {
        const idx = Math.max(0, this.cursor - 1)
        this.cursor = idx
        return this.entries[idx]
    }

    getNext(): string {
        const idx = Math.min(this.entries.length, this.cursor + 1)
        this.cursor = idx
        return this.entries[idx]
    }
}