"""
Monitoring and metrics collection for Samrddhi services
"""

import time
import psutil
import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from prometheus_client import Counter, Histogram, Gauge, CollectorRegistry, generate_latest
import logging

from .utils import get_environment_config


class MetricsCollector:
    """Collect and expose system and business metrics"""
    
    def __init__(self, service_name: str = "samrddhi"):
        self.service_name = service_name
        self.config = get_environment_config()
        self.registry = CollectorRegistry()
        
        # System metrics
        self.cpu_usage = Gauge('system_cpu_usage_percent', 'CPU usage percentage', registry=self.registry)
        self.memory_usage = Gauge('system_memory_usage_bytes', 'Memory usage in bytes', registry=self.registry)
        self.disk_usage = Gauge('system_disk_usage_percent', 'Disk usage percentage', registry=self.registry)
        
        # Application metrics
        self.request_count = Counter(
            'http_requests_total', 
            'Total HTTP requests', 
            ['method', 'endpoint', 'status'],
            registry=self.registry
        )
        self.request_duration = Histogram(
            'http_request_duration_seconds', 
            'HTTP request duration',
            registry=self.registry
        )
        
        # Trading metrics
        self.orders_total = Counter(
            'orders_total',
            'Total orders',
            ['symbol', 'side', 'status'],
            registry=self.registry
        )
        self.portfolio_value = Gauge('portfolio_value_usd', 'Portfolio value in USD', registry=self.registry)
        self.positions_count = Gauge('positions_count', 'Number of open positions', registry=self.registry)
        self.daily_pnl = Gauge('daily_pnl_usd', 'Daily P&L in USD', registry=self.registry)
        self.signals_generated = Counter(
            'signals_generated_total',
            'Total signals generated',
            ['symbol', 'signal_type', 'strategy'],
            registry=self.registry
        )
        
        # Risk metrics
        self.risk_score = Gauge('risk_score', 'Overall risk score (0-100)', registry=self.registry)
        self.max_drawdown = Gauge('max_drawdown_percent', 'Maximum drawdown percentage', registry=self.registry)
        self.volatility = Gauge('portfolio_volatility', 'Portfolio volatility', registry=self.registry)
        
        # Service health metrics
        self.service_health = Gauge(
            'service_health',
            'Service health status (1=healthy, 0=unhealthy)',
            ['service'],
            registry=self.registry
        )
        self.database_connections = Gauge('database_connections_active', 'Active database connections', registry=self.registry)
        
        # Performance metrics
        self.ml_prediction_accuracy = Gauge(
            'ml_prediction_accuracy',
            'ML model prediction accuracy',
            ['model_name', 'strategy'],
            registry=self.registry
        )
        self.order_execution_time = Histogram(
            'order_execution_seconds',
            'Order execution time in seconds',
            registry=self.registry
        )
        
        # Start background metrics collection
        self._start_system_metrics_collection()
    
    def _start_system_metrics_collection(self):
        """Start collecting system metrics in background"""
        asyncio.create_task(self._collect_system_metrics())
    
    async def _collect_system_metrics(self):
        """Collect system metrics periodically"""
        while True:
            try:
                # CPU usage
                cpu_percent = psutil.cpu_percent(interval=1)
                self.cpu_usage.set(cpu_percent)
                
                # Memory usage
                memory = psutil.virtual_memory()
                self.memory_usage.set(memory.used)
                
                # Disk usage
                disk = psutil.disk_usage('/')
                disk_percent = (disk.used / disk.total) * 100
                self.disk_usage.set(disk_percent)
                
                # Wait before next collection
                await asyncio.sleep(30)  # Collect every 30 seconds
                
            except Exception as e:
                logging.error(f"Error collecting system metrics: {e}")
                await asyncio.sleep(60)  # Wait longer on error
    
    def record_request(self, method: str, endpoint: str, status: int, duration: float):
        """Record HTTP request metrics"""
        self.request_count.labels(method=method, endpoint=endpoint, status=status).inc()
        self.request_duration.observe(duration)
    
    def record_order(self, symbol: str, side: str, status: str):
        """Record order metrics"""
        self.orders_total.labels(symbol=symbol, side=side, status=status).inc()
    
    def update_portfolio_metrics(self, value: float, positions: int, daily_pnl: float):
        """Update portfolio metrics"""
        self.portfolio_value.set(value)
        self.positions_count.set(positions)
        self.daily_pnl.set(daily_pnl)
    
    def record_signal(self, symbol: str, signal_type: str, strategy: str):
        """Record signal generation"""
        self.signals_generated.labels(symbol=symbol, signal_type=signal_type, strategy=strategy).inc()
    
    def update_risk_metrics(self, risk_score: float, max_drawdown: float, volatility: float):
        """Update risk metrics"""
        self.risk_score.set(risk_score)
        self.max_drawdown.set(max_drawdown)
        self.volatility.set(volatility)
    
    def update_service_health(self, service: str, is_healthy: bool):
        """Update service health status"""
        self.service_health.labels(service=service).set(1 if is_healthy else 0)
    
    def update_ml_accuracy(self, model_name: str, strategy: str, accuracy: float):
        """Update ML model accuracy"""
        self.ml_prediction_accuracy.labels(model_name=model_name, strategy=strategy).set(accuracy)
    
    def record_order_execution_time(self, execution_time: float):
        """Record order execution time"""
        self.order_execution_time.observe(execution_time)
    
    def get_metrics(self) -> str:
        """Get all metrics in Prometheus format"""
        return generate_latest(self.registry).decode('utf-8')


class HealthChecker:
    """Health check utilities for services"""
    
    def __init__(self, service_name: str):
        self.service_name = service_name
        self.start_time = time.time()
        self.checks = {}
    
    def add_check(self, name: str, check_func, timeout: float = 5.0):
        """Add a health check"""
        self.checks[name] = {
            'func': check_func,
            'timeout': timeout
        }
    
    async def run_checks(self) -> Dict[str, Any]:
        """Run all health checks"""
        results = {
            'service': self.service_name,
            'status': 'healthy',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'uptime_seconds': time.time() - self.start_time,
            'checks': {}
        }
        
        for check_name, check_config in self.checks.items():
            try:
                # Run check with timeout
                start_time = time.time()
                check_result = await asyncio.wait_for(
                    check_config['func'](),
                    timeout=check_config['timeout']
                )
                duration = time.time() - start_time
                
                results['checks'][check_name] = {
                    'status': 'healthy' if check_result else 'unhealthy',
                    'duration_seconds': duration,
                    'details': check_result if isinstance(check_result, dict) else None
                }
                
            except asyncio.TimeoutError:
                results['checks'][check_name] = {
                    'status': 'timeout',
                    'duration_seconds': check_config['timeout'],
                    'error': f"Check timed out after {check_config['timeout']} seconds"
                }
                results['status'] = 'unhealthy'
                
            except Exception as e:
                results['checks'][check_name] = {
                    'status': 'error',
                    'error': str(e)
                }
                results['status'] = 'unhealthy'
        
        return results


class AlertManager:
    """Manage alerts and notifications"""
    
    def __init__(self):
        self.config = get_environment_config()
        self.alert_thresholds = {
            'cpu_usage': 80.0,
            'memory_usage': 85.0,
            'disk_usage': 90.0,
            'error_rate': 5.0,
            'response_time': 2.0,
            'daily_drawdown': 2.0,
            'risk_score': 75.0
        }
        self.active_alerts = set()
    
    async def check_thresholds(self, metrics: Dict[str, float]):
        """Check metrics against thresholds and generate alerts"""
        alerts = []
        
        for metric, value in metrics.items():
            if metric in self.alert_thresholds:
                threshold = self.alert_thresholds[metric]
                alert_key = f"{metric}_threshold"
                
                if value > threshold:
                    if alert_key not in self.active_alerts:
                        alert = {
                            'id': alert_key,
                            'severity': self._get_alert_severity(metric, value, threshold),
                            'metric': metric,
                            'value': value,
                            'threshold': threshold,
                            'message': f"{metric} is {value:.2f}, exceeding threshold of {threshold:.2f}",
                            'timestamp': datetime.now(timezone.utc).isoformat()
                        }
                        alerts.append(alert)
                        self.active_alerts.add(alert_key)
                        
                        # Send notification
                        await self._send_alert(alert)
                else:
                    # Clear alert if value is back to normal
                    if alert_key in self.active_alerts:
                        self.active_alerts.remove(alert_key)
                        await self._clear_alert(alert_key)
        
        return alerts
    
    def _get_alert_severity(self, metric: str, value: float, threshold: float) -> str:
        """Determine alert severity based on how much threshold is exceeded"""
        excess_ratio = (value - threshold) / threshold
        
        if excess_ratio > 0.5:  # 50% over threshold
            return 'critical'
        elif excess_ratio > 0.25:  # 25% over threshold
            return 'high'
        elif excess_ratio > 0.1:  # 10% over threshold
            return 'medium'
        else:
            return 'low'
    
    async def _send_alert(self, alert: Dict[str, Any]):
        """Send alert notification"""
        logging.warning(f"ALERT: {alert['message']}")
        # In production, integrate with email, Slack, SMS, etc.
    
    async def _clear_alert(self, alert_key: str):
        """Clear resolved alert"""
        logging.info(f"ALERT CLEARED: {alert_key}")


class PerformanceProfiler:
    """Profile application performance"""
    
    def __init__(self):
        self.profiles = {}
        self.start_times = {}
    
    def start_profile(self, profile_name: str):
        """Start profiling a operation"""
        self.start_times[profile_name] = time.perf_counter()
    
    def end_profile(self, profile_name: str) -> float:
        """End profiling and return duration"""
        if profile_name not in self.start_times:
            return 0.0
        
        duration = time.perf_counter() - self.start_times[profile_name]
        
        # Store profile data
        if profile_name not in self.profiles:
            self.profiles[profile_name] = []
        
        self.profiles[profile_name].append({
            'duration': duration,
            'timestamp': datetime.now(timezone.utc)
        })
        
        # Keep only last 1000 measurements
        if len(self.profiles[profile_name]) > 1000:
            self.profiles[profile_name] = self.profiles[profile_name][-1000:]
        
        del self.start_times[profile_name]
        return duration
    
    def get_profile_stats(self, profile_name: str) -> Optional[Dict[str, float]]:
        """Get statistics for a profile"""
        if profile_name not in self.profiles or not self.profiles[profile_name]:
            return None
        
        durations = [p['duration'] for p in self.profiles[profile_name]]
        
        return {
            'count': len(durations),
            'min': min(durations),
            'max': max(durations),
            'avg': sum(durations) / len(durations),
            'median': sorted(durations)[len(durations) // 2]
        }
    
    def get_all_profiles(self) -> Dict[str, Dict[str, float]]:
        """Get all profile statistics"""
        return {
            name: self.get_profile_stats(name)
            for name in self.profiles.keys()
        }


# Global instances
metrics_collector = MetricsCollector()
performance_profiler = PerformanceProfiler()
