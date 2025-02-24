const enum StatusType {
    Error,
    Success,
}

type StatusMessage = {
    type: StatusType;
    text: string;
};