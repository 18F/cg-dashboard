import Immutable from "immutable";

import BaseStore from "./base_store.js";
import { activityActionTypes } from "../constants.js";

function parseLogTimestamp(timestamp) {
  const split = timestamp.split(":");
  const splitDate = split[0].split("/");
  const splitOffset = split[3].split(" ");
  const date = `${splitDate[2]}-${splitDate[1]}-${splitDate[0]}`;
  const time = `${split[1]}:${split[2]}`;
  return `${date} ${time} ${splitOffset[1]}`;
}

function parseLogItem(log) {
  const parseMessage = [
    '(.*)\\s-\\s\\[(.*)]\\s"([^"]*)(HTTP/.*)"\\s(\\d+)\\s.*',
    'x_forwarded_for:"(.*)"\\sx_forwarded_proto:"(\\w+)"\\',
    "svcap_request_id:(.*)\\sresponse_time:(.*)\\sapp_id:(.*)"
  ].join("");
  const matches = new RegExp(parseMessage).exec(log.message);

  if (!matches) throw new Error("log item parsing failed");

  const host = matches[1];
  const timestamp = parseLogTimestamp(matches[2]);
  const url = matches[3];
  const protocol = matches[4];
  const statusCode = parseInt(matches[5], 10);
  const xForwardedFor = matches[6];
  const xForwardedProto = matches[7];
  const vcapRequestId = matches[8];
  const responseTime = matches[9];
  const appGuid = matches[10];
  const metadata = {
    x_forward_for: xForwardedFor,
    x_forward_proto: xForwardedProto,
    vcap_request_id: vcapRequestId,
    response_time: responseTime
  };

  return {
    host,
    metadata,
    protocol,
    timestamp,
    app_guid: appGuid,
    guid: `${timestamp}${vcapRequestId}`,
    requested_url: url,
    status_code: statusCode,
    raw: log
  };
}

class ActivityStore extends BaseStore {
  constructor() {
    super();
    this.storeData = new Immutable.List();
    this.subscribe(() => this.handleAction.bind(this));
    this.didFetchEvents = false;
    this.isFetchingEvents = false;
    this.didFetchLogs = false;
    this.isFetchingLogs = false;
    this.errors = {};
  }

  get fetched() {
    return this.didFetchEvents && this.didFetchLogs;
  }

  get fetching() {
    return this.isFetchingEvents || this.isFetchingLogs;
  }

  get hasErrors() {
    return this.errors.log || this.errors.event;
  }

  handleAction(action) {
    let activity;
    switch (action.type) {
      case activityActionTypes.EVENTS_FETCH:
        this.isFetchingEvents = true;
        this.didFetchEvents = false;
        this.emitChange();
        break;

      case activityActionTypes.EVENTS_RECEIVED:
        this.isFetchingEvents = false;
        this.didFetchEvents = true;
        activity = action.events.map(event => {
          const item = Object.assign({}, event, {
            activity_type: "event"
          });
          return item;
        });
        this.mergeMany("guid", activity, () => {});
        this.emitChange();
        break;

      case activityActionTypes.LOGS_FETCH:
        this.isFetchingLogs = true;
        this.didFetchLogs = false;
        this.errors.log = null;
        this.emitChange();
        break;

      case activityActionTypes.LOGS_RECEIVED:
        this.isFetchingLogs = false;
        this.didFetchLogs = true;
        activity = action.logs.map(log => {
          const parsed = Object.assign({}, parseLogItem(log), {
            activity_type: "log"
          });
          return parsed;
        });
        this.mergeMany("guid", activity, () => {});
        this.emitChange();
        break;

      case activityActionTypes.LOGS_ERROR:
        this.isFetchingLogs = false;
        this.didFetchLogs = true;
        this.errors.log = action.err;
        this.emitChange();
        break;

      default:
        break;
    }
  }
}

export default new ActivityStore();
