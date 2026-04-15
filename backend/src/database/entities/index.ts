// Base
export { BaseEntity, BaseUuidEntity } from './base.entity';

// Core
export { User } from './user.entity';
export { Operator } from './operator.entity';
export { Station } from './station.entity';
export { SeatMapConfig } from './seat-map-config.entity';
export { Vehicle } from './vehicle.entity';
export { Trip } from './trip.entity';
export { Segment } from './segment.entity';
export { Seat } from './seat.entity';
export { Booking } from './booking.entity';
export { Ticket } from './ticket.entity';
export { TicketTransfer } from './ticket-transfer.entity';

// Stories
export { OperatorStory } from './operator-story.entity';
export { StoryView } from './story-view.entity';
export { StoryCategory } from './story-category.entity';
export { AdminStory } from './admin-story.entity';

// Advertisements
export { Advertisement } from './advertisement.entity';
export { AdImpression } from './ad-impression.entity';
export { AdClick } from './ad-click.entity';
export { AdConversion } from './ad-conversion.entity';

// Support & Analytics
export { UserSession } from './user-session.entity';
export { UserDevice } from './user-device.entity';
export { Payment } from './payment.entity';
export { Notification } from './notification.entity';
export { AnalyticsEvent } from './analytics-event.entity';

// Organization
export { UserOperatorRole } from './user-operator-role.entity';
export { AmenityType } from './amenity-type.entity';
export { VehicleAmenity } from './vehicle-amenity.entity';
export { Review } from './review.entity';
export { ReviewHelpfulness } from './review-helpfulness.entity';
export { TripSchedule } from './trip-schedule.entity';
export { OperatorBranch } from './operator-branch.entity';

// Booking segments
export { BookingSegment } from './booking-segment.entity';

// Operator config
export { OperatorPolicy } from './operator-policy.entity';
export { OperatorService } from './operator-service.entity';
export { Promotion } from './promotion.entity';

// Geo / Tracking
export { Route } from './route.entity';
export { Incident } from './incident.entity';

// Referrals
export { ReferralCoupon } from './referral-coupon.entity';

// Audit & Security
export { AuditLog } from './audit-log.entity';
export { SecurityEvent } from './security-event.entity';
export { BlockedIp } from './blocked-ip.entity';

// Notifications Center
export { NotificationTemplate } from './notification-template.entity';
export { AutomationRule } from './automation-rule.entity';
export { NotificationCampaign } from './notification-campaign.entity';
export { ScheduledNotification } from './scheduled-notification.entity';

// Policies
export { PlatformPolicy } from './platform-policy.entity';

// Support
export { SupportTicket } from './support-ticket.entity';

// Societe / Pricing
export { PriceSegment } from './price-segment.entity';
export { PriceHistory } from './price-history.entity';
export { CashTransaction } from './cash-transaction.entity';

// Cashier Heartbeat
export { CashierPresence } from './cashier-presence.entity';

// Settings
export { AppSettings } from './app-settings.entity';

// Integrations
export { Integration } from './integration.entity';
export { IntegrationAlertRule } from './integration-alert-rule.entity';
export { IntegrationAlert } from './integration-alert.entity';

// Story Circles & Feature Flags
export { StoryCircle } from './story-circle.entity';
export { FeatureFlag } from './feature-flag.entity';

// External API
export { ApiKey } from './api-key.entity';

// AI Support
export { KnowledgeArticle } from './knowledge-article.entity';
export { AssistantConversation } from './assistant-conversation.entity';
export type { ConversationMessage } from './assistant-conversation.entity';
