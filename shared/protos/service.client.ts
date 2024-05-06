/* eslint-disable */
// @generated by protobuf-ts 2.9.0 with parameter generate_dependencies,ts_nocheck,eslint_disable
// @generated from protobuf file "service.proto" (package "elephant.repository", syntax proto3)
// tslint:disable
// @ts-nocheck
import { Metrics } from "./service.js";
import type { RegisterMetricResponse } from "./service.js";
import type { RegisterMetricRequest } from "./service.js";
import type { GetMetricKindsResponse } from "./service.js";
import type { GetMetricKindsRequest } from "./service.js";
import type { DeleteMetricKindResponse } from "./service.js";
import type { DeleteMetricKindRequest } from "./service.js";
import type { RegisterMetricKindResponse } from "./service.js";
import type { RegisterMetricKindRequest } from "./service.js";
import { Reports } from "./service.js";
import type { TestReportResponse } from "./service.js";
import type { TestReportRequest } from "./service.js";
import type { RunReportResponse } from "./service.js";
import type { RunReportRequest } from "./service.js";
import type { GetReportResponse } from "./service.js";
import type { GetReportRequest } from "./service.js";
import type { UpdateReportResponse } from "./service.js";
import type { UpdateReportRequest } from "./service.js";
import { Workflows } from "./service.js";
import type { GetStatusRulesResponse } from "./service.js";
import type { GetStatusRulesRequest } from "./service.js";
import type { DeleteStatusRuleResponse } from "./service.js";
import type { DeleteStatusRuleRequest } from "./service.js";
import type { CreateStatusRuleResponse } from "./service.js";
import type { CreateStatusRuleRequest } from "./service.js";
import type { GetStatusesResponse } from "./service.js";
import type { GetStatusesRequest } from "./service.js";
import type { UpdateStatusResponse } from "./service.js";
import type { UpdateStatusRequest } from "./service.js";
import { Schemas } from "./service.js";
import type { GetAllActiveSchemasResponse } from "./service.js";
import type { GetAllActiveSchemasRequest } from "./service.js";
import type { GetSchemaResponse } from "./service.js";
import type { GetSchemaRequest } from "./service.js";
import type { SetActiveSchemaResponse } from "./service.js";
import type { SetActiveSchemaRequest } from "./service.js";
import type { RegisterSchemaResponse } from "./service.js";
import type { RegisterSchemaRequest } from "./service.js";
import type { RpcTransport } from "@protobuf-ts/runtime-rpc";
import type { ServiceInfo } from "@protobuf-ts/runtime-rpc";
import { Documents } from "./service.js";
import type { GetStatusHistoryReponse } from "./service.js";
import type { GetStatusHistoryRequest } from "./service.js";
import type { GetEventlogResponse } from "./service.js";
import type { GetEventlogRequest } from "./service.js";
import type { GetMetaResponse } from "./service.js";
import type { GetMetaRequest } from "./service.js";
import type { DeleteDocumentResponse } from "./service.js";
import type { DeleteDocumentRequest } from "./service.js";
import type { ValidateResponse } from "./service.js";
import type { ValidateRequest } from "./service.js";
import type { UpdateResponse } from "./service.js";
import type { UpdateRequest } from "./service.js";
import type { GetHistoryResponse } from "./service.js";
import type { GetHistoryRequest } from "./service.js";
import { stackIntercept } from "@protobuf-ts/runtime-rpc";
import type { GetDocumentResponse } from "./service.js";
import type { GetDocumentRequest } from "./service.js";
import type { UnaryCall } from "@protobuf-ts/runtime-rpc";
import type { RpcOptions } from "@protobuf-ts/runtime-rpc";
/**
 * @generated from protobuf service elephant.repository.Documents
 */
export interface IDocumentsClient {
    /**
     * Get retrieves a document version.
     *
     * @generated from protobuf rpc: Get(elephant.repository.GetDocumentRequest) returns (elephant.repository.GetDocumentResponse);
     */
    get(input: GetDocumentRequest, options?: RpcOptions): UnaryCall<GetDocumentRequest, GetDocumentResponse>;
    /**
     * GetHistory lists the document version history.
     *
     * @generated from protobuf rpc: GetHistory(elephant.repository.GetHistoryRequest) returns (elephant.repository.GetHistoryResponse);
     */
    getHistory(input: GetHistoryRequest, options?: RpcOptions): UnaryCall<GetHistoryRequest, GetHistoryResponse>;
    /**
     * Update is used to create new document versions, set statuses, update ACLs.
     *
     * @generated from protobuf rpc: Update(elephant.repository.UpdateRequest) returns (elephant.repository.UpdateResponse);
     */
    update(input: UpdateRequest, options?: RpcOptions): UnaryCall<UpdateRequest, UpdateResponse>;
    /**
     * Validate is used to validate a document without writing it to the
     * repository.
     *
     * @generated from protobuf rpc: Validate(elephant.repository.ValidateRequest) returns (elephant.repository.ValidateResponse);
     */
    validate(input: ValidateRequest, options?: RpcOptions): UnaryCall<ValidateRequest, ValidateResponse>;
    /**
     * Delete deletes a document and all its associated data.
     *
     * @generated from protobuf rpc: Delete(elephant.repository.DeleteDocumentRequest) returns (elephant.repository.DeleteDocumentResponse);
     */
    delete(input: DeleteDocumentRequest, options?: RpcOptions): UnaryCall<DeleteDocumentRequest, DeleteDocumentResponse>;
    /**
     * GetMeta returns metadata for a document, including the ACL and current
     * status heads.
     *
     * @generated from protobuf rpc: GetMeta(elephant.repository.GetMetaRequest) returns (elephant.repository.GetMetaResponse);
     */
    getMeta(input: GetMetaRequest, options?: RpcOptions): UnaryCall<GetMetaRequest, GetMetaResponse>;
    /**
     * Eventlog returns document update events, optionally waiting for new events.
     *
     * @generated from protobuf rpc: Eventlog(elephant.repository.GetEventlogRequest) returns (elephant.repository.GetEventlogResponse);
     */
    eventlog(input: GetEventlogRequest, options?: RpcOptions): UnaryCall<GetEventlogRequest, GetEventlogResponse>;
    /**
     * GetStatusHistory returns the history of a status for a document.
     *
     * @generated from protobuf rpc: GetStatusHistory(elephant.repository.GetStatusHistoryRequest) returns (elephant.repository.GetStatusHistoryReponse);
     */
    getStatusHistory(input: GetStatusHistoryRequest, options?: RpcOptions): UnaryCall<GetStatusHistoryRequest, GetStatusHistoryReponse>;
}
/**
 * @generated from protobuf service elephant.repository.Documents
 */
export class DocumentsClient implements IDocumentsClient, ServiceInfo {
    typeName = Documents.typeName;
    methods = Documents.methods;
    options = Documents.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * Get retrieves a document version.
     *
     * @generated from protobuf rpc: Get(elephant.repository.GetDocumentRequest) returns (elephant.repository.GetDocumentResponse);
     */
    get(input: GetDocumentRequest, options?: RpcOptions): UnaryCall<GetDocumentRequest, GetDocumentResponse> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<GetDocumentRequest, GetDocumentResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * GetHistory lists the document version history.
     *
     * @generated from protobuf rpc: GetHistory(elephant.repository.GetHistoryRequest) returns (elephant.repository.GetHistoryResponse);
     */
    getHistory(input: GetHistoryRequest, options?: RpcOptions): UnaryCall<GetHistoryRequest, GetHistoryResponse> {
        const method = this.methods[1], opt = this._transport.mergeOptions(options);
        return stackIntercept<GetHistoryRequest, GetHistoryResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * Update is used to create new document versions, set statuses, update ACLs.
     *
     * @generated from protobuf rpc: Update(elephant.repository.UpdateRequest) returns (elephant.repository.UpdateResponse);
     */
    update(input: UpdateRequest, options?: RpcOptions): UnaryCall<UpdateRequest, UpdateResponse> {
        const method = this.methods[2], opt = this._transport.mergeOptions(options);
        return stackIntercept<UpdateRequest, UpdateResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * Validate is used to validate a document without writing it to the
     * repository.
     *
     * @generated from protobuf rpc: Validate(elephant.repository.ValidateRequest) returns (elephant.repository.ValidateResponse);
     */
    validate(input: ValidateRequest, options?: RpcOptions): UnaryCall<ValidateRequest, ValidateResponse> {
        const method = this.methods[3], opt = this._transport.mergeOptions(options);
        return stackIntercept<ValidateRequest, ValidateResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * Delete deletes a document and all its associated data.
     *
     * @generated from protobuf rpc: Delete(elephant.repository.DeleteDocumentRequest) returns (elephant.repository.DeleteDocumentResponse);
     */
    delete(input: DeleteDocumentRequest, options?: RpcOptions): UnaryCall<DeleteDocumentRequest, DeleteDocumentResponse> {
        const method = this.methods[4], opt = this._transport.mergeOptions(options);
        return stackIntercept<DeleteDocumentRequest, DeleteDocumentResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * GetMeta returns metadata for a document, including the ACL and current
     * status heads.
     *
     * @generated from protobuf rpc: GetMeta(elephant.repository.GetMetaRequest) returns (elephant.repository.GetMetaResponse);
     */
    getMeta(input: GetMetaRequest, options?: RpcOptions): UnaryCall<GetMetaRequest, GetMetaResponse> {
        const method = this.methods[5], opt = this._transport.mergeOptions(options);
        return stackIntercept<GetMetaRequest, GetMetaResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * Eventlog returns document update events, optionally waiting for new events.
     *
     * @generated from protobuf rpc: Eventlog(elephant.repository.GetEventlogRequest) returns (elephant.repository.GetEventlogResponse);
     */
    eventlog(input: GetEventlogRequest, options?: RpcOptions): UnaryCall<GetEventlogRequest, GetEventlogResponse> {
        const method = this.methods[6], opt = this._transport.mergeOptions(options);
        return stackIntercept<GetEventlogRequest, GetEventlogResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * GetStatusHistory returns the history of a status for a document.
     *
     * @generated from protobuf rpc: GetStatusHistory(elephant.repository.GetStatusHistoryRequest) returns (elephant.repository.GetStatusHistoryReponse);
     */
    getStatusHistory(input: GetStatusHistoryRequest, options?: RpcOptions): UnaryCall<GetStatusHistoryRequest, GetStatusHistoryReponse> {
        const method = this.methods[7], opt = this._transport.mergeOptions(options);
        return stackIntercept<GetStatusHistoryRequest, GetStatusHistoryReponse>("unary", this._transport, method, opt, input);
    }
}
/**
 * @generated from protobuf service elephant.repository.Schemas
 */
export interface ISchemasClient {
    /**
     * Register register a new validation schema version.
     *
     * @generated from protobuf rpc: Register(elephant.repository.RegisterSchemaRequest) returns (elephant.repository.RegisterSchemaResponse);
     */
    register(input: RegisterSchemaRequest, options?: RpcOptions): UnaryCall<RegisterSchemaRequest, RegisterSchemaResponse>;
    /**
     * SetActive activates schema versions.
     *
     * @generated from protobuf rpc: SetActive(elephant.repository.SetActiveSchemaRequest) returns (elephant.repository.SetActiveSchemaResponse);
     */
    setActive(input: SetActiveSchemaRequest, options?: RpcOptions): UnaryCall<SetActiveSchemaRequest, SetActiveSchemaResponse>;
    /**
     * Get retrieves a schema.
     *
     * @generated from protobuf rpc: Get(elephant.repository.GetSchemaRequest) returns (elephant.repository.GetSchemaResponse);
     */
    get(input: GetSchemaRequest, options?: RpcOptions): UnaryCall<GetSchemaRequest, GetSchemaResponse>;
    /**
     * GetAllActiveSchemas returns the currently active schemas.
     *
     * @generated from protobuf rpc: GetAllActive(elephant.repository.GetAllActiveSchemasRequest) returns (elephant.repository.GetAllActiveSchemasResponse);
     */
    getAllActive(input: GetAllActiveSchemasRequest, options?: RpcOptions): UnaryCall<GetAllActiveSchemasRequest, GetAllActiveSchemasResponse>;
}
/**
 * @generated from protobuf service elephant.repository.Schemas
 */
export class SchemasClient implements ISchemasClient, ServiceInfo {
    typeName = Schemas.typeName;
    methods = Schemas.methods;
    options = Schemas.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * Register register a new validation schema version.
     *
     * @generated from protobuf rpc: Register(elephant.repository.RegisterSchemaRequest) returns (elephant.repository.RegisterSchemaResponse);
     */
    register(input: RegisterSchemaRequest, options?: RpcOptions): UnaryCall<RegisterSchemaRequest, RegisterSchemaResponse> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<RegisterSchemaRequest, RegisterSchemaResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * SetActive activates schema versions.
     *
     * @generated from protobuf rpc: SetActive(elephant.repository.SetActiveSchemaRequest) returns (elephant.repository.SetActiveSchemaResponse);
     */
    setActive(input: SetActiveSchemaRequest, options?: RpcOptions): UnaryCall<SetActiveSchemaRequest, SetActiveSchemaResponse> {
        const method = this.methods[1], opt = this._transport.mergeOptions(options);
        return stackIntercept<SetActiveSchemaRequest, SetActiveSchemaResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * Get retrieves a schema.
     *
     * @generated from protobuf rpc: Get(elephant.repository.GetSchemaRequest) returns (elephant.repository.GetSchemaResponse);
     */
    get(input: GetSchemaRequest, options?: RpcOptions): UnaryCall<GetSchemaRequest, GetSchemaResponse> {
        const method = this.methods[2], opt = this._transport.mergeOptions(options);
        return stackIntercept<GetSchemaRequest, GetSchemaResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * GetAllActiveSchemas returns the currently active schemas.
     *
     * @generated from protobuf rpc: GetAllActive(elephant.repository.GetAllActiveSchemasRequest) returns (elephant.repository.GetAllActiveSchemasResponse);
     */
    getAllActive(input: GetAllActiveSchemasRequest, options?: RpcOptions): UnaryCall<GetAllActiveSchemasRequest, GetAllActiveSchemasResponse> {
        const method = this.methods[3], opt = this._transport.mergeOptions(options);
        return stackIntercept<GetAllActiveSchemasRequest, GetAllActiveSchemasResponse>("unary", this._transport, method, opt, input);
    }
}
/**
 * @generated from protobuf service elephant.repository.Workflows
 */
export interface IWorkflowsClient {
    /**
     * UpdateStatus creates or updates a status that can be used for documents.
     *
     * @generated from protobuf rpc: UpdateStatus(elephant.repository.UpdateStatusRequest) returns (elephant.repository.UpdateStatusResponse);
     */
    updateStatus(input: UpdateStatusRequest, options?: RpcOptions): UnaryCall<UpdateStatusRequest, UpdateStatusResponse>;
    /**
     * GetStatuses lists all enabled statuses.
     *
     * @generated from protobuf rpc: GetStatuses(elephant.repository.GetStatusesRequest) returns (elephant.repository.GetStatusesResponse);
     */
    getStatuses(input: GetStatusesRequest, options?: RpcOptions): UnaryCall<GetStatusesRequest, GetStatusesResponse>;
    /**
     * CreateStatusRule creates or updates a status rule that should be applied
     * when setting statuses.
     *
     * @generated from protobuf rpc: CreateStatusRule(elephant.repository.CreateStatusRuleRequest) returns (elephant.repository.CreateStatusRuleResponse);
     */
    createStatusRule(input: CreateStatusRuleRequest, options?: RpcOptions): UnaryCall<CreateStatusRuleRequest, CreateStatusRuleResponse>;
    /**
     * DeleteStatusRule removes a status rule.
     *
     * @generated from protobuf rpc: DeleteStatusRule(elephant.repository.DeleteStatusRuleRequest) returns (elephant.repository.DeleteStatusRuleResponse);
     */
    deleteStatusRule(input: DeleteStatusRuleRequest, options?: RpcOptions): UnaryCall<DeleteStatusRuleRequest, DeleteStatusRuleResponse>;
    /**
     * GetStatusRules returns all status rules.
     *
     * @generated from protobuf rpc: GetStatusRules(elephant.repository.GetStatusRulesRequest) returns (elephant.repository.GetStatusRulesResponse);
     */
    getStatusRules(input: GetStatusRulesRequest, options?: RpcOptions): UnaryCall<GetStatusRulesRequest, GetStatusRulesResponse>;
}
/**
 * @generated from protobuf service elephant.repository.Workflows
 */
export class WorkflowsClient implements IWorkflowsClient, ServiceInfo {
    typeName = Workflows.typeName;
    methods = Workflows.methods;
    options = Workflows.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * UpdateStatus creates or updates a status that can be used for documents.
     *
     * @generated from protobuf rpc: UpdateStatus(elephant.repository.UpdateStatusRequest) returns (elephant.repository.UpdateStatusResponse);
     */
    updateStatus(input: UpdateStatusRequest, options?: RpcOptions): UnaryCall<UpdateStatusRequest, UpdateStatusResponse> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<UpdateStatusRequest, UpdateStatusResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * GetStatuses lists all enabled statuses.
     *
     * @generated from protobuf rpc: GetStatuses(elephant.repository.GetStatusesRequest) returns (elephant.repository.GetStatusesResponse);
     */
    getStatuses(input: GetStatusesRequest, options?: RpcOptions): UnaryCall<GetStatusesRequest, GetStatusesResponse> {
        const method = this.methods[1], opt = this._transport.mergeOptions(options);
        return stackIntercept<GetStatusesRequest, GetStatusesResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * CreateStatusRule creates or updates a status rule that should be applied
     * when setting statuses.
     *
     * @generated from protobuf rpc: CreateStatusRule(elephant.repository.CreateStatusRuleRequest) returns (elephant.repository.CreateStatusRuleResponse);
     */
    createStatusRule(input: CreateStatusRuleRequest, options?: RpcOptions): UnaryCall<CreateStatusRuleRequest, CreateStatusRuleResponse> {
        const method = this.methods[2], opt = this._transport.mergeOptions(options);
        return stackIntercept<CreateStatusRuleRequest, CreateStatusRuleResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * DeleteStatusRule removes a status rule.
     *
     * @generated from protobuf rpc: DeleteStatusRule(elephant.repository.DeleteStatusRuleRequest) returns (elephant.repository.DeleteStatusRuleResponse);
     */
    deleteStatusRule(input: DeleteStatusRuleRequest, options?: RpcOptions): UnaryCall<DeleteStatusRuleRequest, DeleteStatusRuleResponse> {
        const method = this.methods[3], opt = this._transport.mergeOptions(options);
        return stackIntercept<DeleteStatusRuleRequest, DeleteStatusRuleResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * GetStatusRules returns all status rules.
     *
     * @generated from protobuf rpc: GetStatusRules(elephant.repository.GetStatusRulesRequest) returns (elephant.repository.GetStatusRulesResponse);
     */
    getStatusRules(input: GetStatusRulesRequest, options?: RpcOptions): UnaryCall<GetStatusRulesRequest, GetStatusRulesResponse> {
        const method = this.methods[4], opt = this._transport.mergeOptions(options);
        return stackIntercept<GetStatusRulesRequest, GetStatusRulesResponse>("unary", this._transport, method, opt, input);
    }
}
/**
 * @generated from protobuf service elephant.repository.Reports
 */
export interface IReportsClient {
    /**
     * Update or create a report.
     *
     * @generated from protobuf rpc: Update(elephant.repository.UpdateReportRequest) returns (elephant.repository.UpdateReportResponse);
     */
    update(input: UpdateReportRequest, options?: RpcOptions): UnaryCall<UpdateReportRequest, UpdateReportResponse>;
    /**
     * Get a report.
     *
     * @generated from protobuf rpc: Get(elephant.repository.GetReportRequest) returns (elephant.repository.GetReportResponse);
     */
    get(input: GetReportRequest, options?: RpcOptions): UnaryCall<GetReportRequest, GetReportResponse>;
    /**
     * Run a report. This will run the report and return the results instead of
     * sending it to any outputs.
     *
     * @generated from protobuf rpc: Run(elephant.repository.RunReportRequest) returns (elephant.repository.RunReportResponse);
     */
    run(input: RunReportRequest, options?: RpcOptions): UnaryCall<RunReportRequest, RunReportResponse>;
    /**
     * Test a report by runing it without saving.
     *
     * @generated from protobuf rpc: Test(elephant.repository.TestReportRequest) returns (elephant.repository.TestReportResponse);
     */
    test(input: TestReportRequest, options?: RpcOptions): UnaryCall<TestReportRequest, TestReportResponse>;
}
/**
 * @generated from protobuf service elephant.repository.Reports
 */
export class ReportsClient implements IReportsClient, ServiceInfo {
    typeName = Reports.typeName;
    methods = Reports.methods;
    options = Reports.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * Update or create a report.
     *
     * @generated from protobuf rpc: Update(elephant.repository.UpdateReportRequest) returns (elephant.repository.UpdateReportResponse);
     */
    update(input: UpdateReportRequest, options?: RpcOptions): UnaryCall<UpdateReportRequest, UpdateReportResponse> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<UpdateReportRequest, UpdateReportResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * Get a report.
     *
     * @generated from protobuf rpc: Get(elephant.repository.GetReportRequest) returns (elephant.repository.GetReportResponse);
     */
    get(input: GetReportRequest, options?: RpcOptions): UnaryCall<GetReportRequest, GetReportResponse> {
        const method = this.methods[1], opt = this._transport.mergeOptions(options);
        return stackIntercept<GetReportRequest, GetReportResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * Run a report. This will run the report and return the results instead of
     * sending it to any outputs.
     *
     * @generated from protobuf rpc: Run(elephant.repository.RunReportRequest) returns (elephant.repository.RunReportResponse);
     */
    run(input: RunReportRequest, options?: RpcOptions): UnaryCall<RunReportRequest, RunReportResponse> {
        const method = this.methods[2], opt = this._transport.mergeOptions(options);
        return stackIntercept<RunReportRequest, RunReportResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * Test a report by runing it without saving.
     *
     * @generated from protobuf rpc: Test(elephant.repository.TestReportRequest) returns (elephant.repository.TestReportResponse);
     */
    test(input: TestReportRequest, options?: RpcOptions): UnaryCall<TestReportRequest, TestReportResponse> {
        const method = this.methods[3], opt = this._transport.mergeOptions(options);
        return stackIntercept<TestReportRequest, TestReportResponse>("unary", this._transport, method, opt, input);
    }
}
/**
 * @generated from protobuf service elephant.repository.Metrics
 */
export interface IMetricsClient {
    /**
     * Register a metric kind
     *
     * @generated from protobuf rpc: RegisterKind(elephant.repository.RegisterMetricKindRequest) returns (elephant.repository.RegisterMetricKindResponse);
     */
    registerKind(input: RegisterMetricKindRequest, options?: RpcOptions): UnaryCall<RegisterMetricKindRequest, RegisterMetricKindResponse>;
    /**
     * Delete a metric kind
     *
     * @generated from protobuf rpc: DeleteKind(elephant.repository.DeleteMetricKindRequest) returns (elephant.repository.DeleteMetricKindResponse);
     */
    deleteKind(input: DeleteMetricKindRequest, options?: RpcOptions): UnaryCall<DeleteMetricKindRequest, DeleteMetricKindResponse>;
    /**
     * List all metric kinds
     *
     * @generated from protobuf rpc: GetKinds(elephant.repository.GetMetricKindsRequest) returns (elephant.repository.GetMetricKindsResponse);
     */
    getKinds(input: GetMetricKindsRequest, options?: RpcOptions): UnaryCall<GetMetricKindsRequest, GetMetricKindsResponse>;
    /**
     * Register a data point
     *
     * @generated from protobuf rpc: RegisterMetric(elephant.repository.RegisterMetricRequest) returns (elephant.repository.RegisterMetricResponse);
     */
    registerMetric(input: RegisterMetricRequest, options?: RpcOptions): UnaryCall<RegisterMetricRequest, RegisterMetricResponse>;
}
/**
 * @generated from protobuf service elephant.repository.Metrics
 */
export class MetricsClient implements IMetricsClient, ServiceInfo {
    typeName = Metrics.typeName;
    methods = Metrics.methods;
    options = Metrics.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * Register a metric kind
     *
     * @generated from protobuf rpc: RegisterKind(elephant.repository.RegisterMetricKindRequest) returns (elephant.repository.RegisterMetricKindResponse);
     */
    registerKind(input: RegisterMetricKindRequest, options?: RpcOptions): UnaryCall<RegisterMetricKindRequest, RegisterMetricKindResponse> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<RegisterMetricKindRequest, RegisterMetricKindResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * Delete a metric kind
     *
     * @generated from protobuf rpc: DeleteKind(elephant.repository.DeleteMetricKindRequest) returns (elephant.repository.DeleteMetricKindResponse);
     */
    deleteKind(input: DeleteMetricKindRequest, options?: RpcOptions): UnaryCall<DeleteMetricKindRequest, DeleteMetricKindResponse> {
        const method = this.methods[1], opt = this._transport.mergeOptions(options);
        return stackIntercept<DeleteMetricKindRequest, DeleteMetricKindResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * List all metric kinds
     *
     * @generated from protobuf rpc: GetKinds(elephant.repository.GetMetricKindsRequest) returns (elephant.repository.GetMetricKindsResponse);
     */
    getKinds(input: GetMetricKindsRequest, options?: RpcOptions): UnaryCall<GetMetricKindsRequest, GetMetricKindsResponse> {
        const method = this.methods[2], opt = this._transport.mergeOptions(options);
        return stackIntercept<GetMetricKindsRequest, GetMetricKindsResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * Register a data point
     *
     * @generated from protobuf rpc: RegisterMetric(elephant.repository.RegisterMetricRequest) returns (elephant.repository.RegisterMetricResponse);
     */
    registerMetric(input: RegisterMetricRequest, options?: RpcOptions): UnaryCall<RegisterMetricRequest, RegisterMetricResponse> {
        const method = this.methods[3], opt = this._transport.mergeOptions(options);
        return stackIntercept<RegisterMetricRequest, RegisterMetricResponse>("unary", this._transport, method, opt, input);
    }
}