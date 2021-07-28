export class Bid {
  public id: number;
  public userProfile: number;
  public round: number;
  public choice: number;
  public award_order: number;
  public bid_date: Date;
  public vac_type: string;
  public award_opt: string;
  public use_hol: boolean;

  constructor(
    id: number,
    userProfile: number,
    round: number,
    choice: number,
    award_order: number,
    bid_date: Date,
    vac_type: string,
    award_opt: string,
    use_hol: boolean) {

    this.id = id;
    this.userProfile = userProfile;
    this.round = round;
    this.choice = choice;
    this.award_order = award_order;
    this.bid_date = bid_date;
    this.vac_type = vac_type;
    this.award_opt = award_opt;
    this.use_hol = use_hol;
  }
}
