export interface Config {
    games: Game[];
    download_path: string;
    patreon?: Member;


    path: string;
}

export interface Member {
    campaign_lifetime_support_cents: number;
    currently_entitled_amount_cents: number;
    email?: string;
    full_name: string;
    is_follower: boolean;
    is_free_trial: boolean;
    is_gifted: boolean;
    last_charge_date?: string;
    last_charge_status?: string;
    lifetime_support_cents: number;
    next_charge_date?: string;
    note: string;
    patron_status?: string;
    pledge_cadence?: number;
    pledge_relationship_start: string;
    will_pay_amount_cents: number;
}
