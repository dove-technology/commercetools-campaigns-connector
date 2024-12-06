import {
  DoveTechAction,
  DoveTechDiscountsDataInstance,
  DoveTechDiscountsResponse,
  DoveTechDiscountsResponseBasket,
  DoveTechDiscountsResponseCost,
  DoveTechDiscountsResponseLineItem,
} from '../types/dovetech.types';

export default class DoveTechResponseBuilder {
  private basket: DoveTechDiscountsResponseBasket | null = null;
  private actions: DoveTechAction[] = [];
  private costs: DoveTechDiscountsResponseCost[] = [];
  private commitId: string | null = null;
  private dataInstance: string | null = DoveTechDiscountsDataInstance.Live;

  addDataInstance(dataInstance: string) {
    this.dataInstance = dataInstance;
    return this;
  }

  addCommitId(commitId: string) {
    this.commitId = commitId;
    return this;
  }

  addAction(action: DoveTechAction) {
    this.actions.push(action);
    return this;
  }

  addLineItem(lineItem: DoveTechDiscountsResponseLineItem) {
    if (!this.basket) {
      this.basket = {
        total: 0,
        totalAmountOff: 0,
        items: [],
      };
    }

    this.basket.items.push(lineItem);
    this.basket.total += lineItem.total;
    this.basket.totalAmountOff += lineItem.totalAmountOff;

    return this;
  }

  addCost(cost: DoveTechDiscountsResponseCost) {
    this.costs.push(cost);
    return this;
  }

  build(): DoveTechDiscountsResponse {
    let aggregateTotal = this.basket ? this.basket.total : 0;
    let aggregateTotalAmountOff = this.basket ? this.basket.totalAmountOff : 0;

    this.costs.forEach((cost) => {
      aggregateTotal += cost.value;
      aggregateTotalAmountOff += cost.totalAmountOff;
    });

    return {
      actions: this.actions,
      basket: this.basket,
      commitId: this.commitId,
      dataInstance: this.dataInstance,
      aggregates: {
        total: aggregateTotal,
        totalAmountOff: aggregateTotalAmountOff,
      },
      costs: this.costs,
    };
  }
}
