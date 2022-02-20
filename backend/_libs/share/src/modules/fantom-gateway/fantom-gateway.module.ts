import { Module } from "@nestjs/common";
import { FantomGatewayGateway } from "./fantom-gateway.gateway";

@Module({
  imports: [],
  providers: [FantomGatewayGateway],
  exports: [FantomGatewayGateway],
})
export class FantomGatewayModule {}
