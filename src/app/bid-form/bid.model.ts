export class Bid {
  public id: number;
  public userProfile: number;
  public round: number;
  public choice: number;
  public awardOrder: number;
  public bidDate: Date;
  public vacType: string;
  public awardOption: string;
  public useHoliday: boolean;

  constructor(
    id: number,
    userProfile: number,
    round: number,
    choice: number,
    awardOrder: number,
    bidDate: Date,
    vacType: string,
    awardOption: string,
    useHoliday: boolean) {

    this.id = id;
    this.userProfile = userProfile;
    this.round = round;
    this.choice = choice;
    this.awardOrder = awardOrder;
    this.bidDate = bidDate;
    this.vacType = vacType;
    this.awardOption = awardOption;
    this.useHoliday = useHoliday;
  }
}
