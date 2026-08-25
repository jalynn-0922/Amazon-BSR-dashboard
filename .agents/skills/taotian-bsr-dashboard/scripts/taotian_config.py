#!/usr/bin/env python3
"""
配置管理模块

支持从环境变量或 .env 文件读取配置
"""

import os
import re
from pathlib import Path
from dataclasses import dataclass


class ConfigError(ValueError):
    """配置错误"""
    pass


IDENTIFIER_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def validate_identifier(value: str, name: str) -> str:
    if not value:
        raise ConfigError(f"{name} is required")
    if not IDENTIFIER_RE.fullmatch(value):
        raise ConfigError(f"{name} must be a simple Doris identifier, got {value!r}")
    return value


@dataclass
class DatabaseConfig:
    """数据库配置"""
    host: str
    port: int
    user: str
    password: str
    database: str
    target_table: str
    source_table: str
    stream_load_hosts: str
    stream_load_ports: str
    stream_load_fallback_host: str = ""
    stream_load_fallback_port: int = 0

    @classmethod
    def from_env(cls, prefix: str = "TAOTIAN_DORIS_"):
        """从环境变量加载配置"""
        host = os.environ.get(f"{prefix}HOST", "")
        port = int(os.environ.get(f"{prefix}PORT", "30930"))
        user = os.environ.get(f"{prefix}USER", "")
        password = os.environ.get(f"{prefix}PASSWORD", "")
        database = os.environ.get(f"{prefix}DATABASE", "")
        target_table = os.environ.get(f"{prefix}TARGET_TABLE", "")
        source_table = os.environ.get(f"{prefix}SOURCE_TABLE", "")
        stream_load_hosts = os.environ.get(
            f"{prefix}STREAM_LOAD_HOSTS",
            os.environ.get(f"{prefix}STREAM_LOAD_HOST", "")
        )
        stream_load_ports = os.environ.get(
            f"{prefix}STREAM_LOAD_PORTS",
            os.environ.get(
                f"{prefix}STREAM_LOAD_PORT",
                os.environ.get(f"{prefix}HTTP_PORTS", os.environ.get(f"{prefix}HTTP_PORT", ""))
            )
        )
        stream_load_fallback_host = os.environ.get(f"{prefix}STREAM_LOAD_FALLBACK_HOST", "")
        stream_load_fallback_port_raw = os.environ.get(f"{prefix}STREAM_LOAD_FALLBACK_PORT", "0")
        allowed_stream_load_host = os.environ.get(f"{prefix}ALLOWED_STREAM_LOAD_HOST", "")
        allowed_stream_load_port = os.environ.get(f"{prefix}ALLOWED_STREAM_LOAD_PORT", "")

        missing = []
        if not host:
            missing.append(f"{prefix}HOST")
        if not user:
            missing.append(f"{prefix}USER")
        if not password:
            missing.append(f"{prefix}PASSWORD")
        if not database:
            missing.append(f"{prefix}DATABASE")
        if not target_table:
            missing.append(f"{prefix}TARGET_TABLE")
        if not source_table:
            missing.append(f"{prefix}SOURCE_TABLE")
        if not stream_load_hosts:
            missing.append(f"{prefix}STREAM_LOAD_HOSTS or {prefix}STREAM_LOAD_HOST")
        if not stream_load_ports:
            missing.append(f"{prefix}STREAM_LOAD_PORTS or {prefix}STREAM_LOAD_PORT")
        if missing:
            raise ConfigError(f"Missing required config: {', '.join(missing)}")
        database = validate_identifier(database, f"{prefix}DATABASE")
        target_table = validate_identifier(target_table, f"{prefix}TARGET_TABLE")
        source_table = validate_identifier(source_table, f"{prefix}SOURCE_TABLE")
        try:
            stream_load_fallback_port = int(stream_load_fallback_port_raw or "0")
        except ValueError:
            raise ConfigError(
                f"{prefix}STREAM_LOAD_FALLBACK_PORT must be an integer, got {stream_load_fallback_port_raw!r}"
            )

        cfg = cls(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database,
            target_table=target_table,
            source_table=source_table,
            stream_load_hosts=stream_load_hosts,
            stream_load_ports=stream_load_ports,
            stream_load_fallback_host=stream_load_fallback_host,
            stream_load_fallback_port=stream_load_fallback_port,
        )
        targets = cfg.stream_load_targets()
        allowed_stream_load_hosts = [
            item.strip() for item in allowed_stream_load_host.split(",") if item.strip()
        ]
        allowed_stream_load_ports = [
            item.strip() for item in allowed_stream_load_port.split(",") if item.strip()
        ]
        if allowed_stream_load_hosts and any(host not in allowed_stream_load_hosts for _, host, _ in targets):
            raise ConfigError("Stream Load host not allowed")
        if allowed_stream_load_ports and any(str(port) not in allowed_stream_load_ports for _, _, port in targets):
            raise ConfigError("Stream Load port not allowed")
        return cfg

    def connection_targets(self):
        """返回按优先级排列的 Doris 查询地址列表。"""
        return [(self.host, self.port)]

    def stream_load_targets(self):
        """返回按优先级排列的 Doris Stream Load HTTP 地址。"""
        hosts = [item.strip() for item in self.stream_load_hosts.split(",") if item.strip()]
        raw_ports = [item.strip() for item in self.stream_load_ports.split(",") if item.strip()]
        if not hosts:
            raise ConfigError("DORIS_STREAM_LOAD_HOSTS or DORIS_STREAM_LOAD_HOST is required")
        if not raw_ports:
            raise ConfigError("DORIS_STREAM_LOAD_PORTS or DORIS_STREAM_LOAD_PORT is required")
        try:
            ports = [int(item) for item in raw_ports]
        except ValueError:
            raise ConfigError(f"Stream Load ports must be integers, got {self.stream_load_ports!r}")
        if len(ports) == 1 and len(hosts) > 1:
            ports = ports * len(hosts)
        if len(hosts) != len(ports):
            raise ConfigError(
                "Stream Load hosts and ports must have the same length, or one port for all hosts"
            )

        targets = [
            ("primary" if idx == 0 else f"primary-{idx + 1}", host, port)
            for idx, (host, port) in enumerate(zip(hosts, ports))
        ]
        if self.stream_load_fallback_host:
            if not 1 <= int(self.stream_load_fallback_port) <= 65535:
                raise ConfigError("DORIS_STREAM_LOAD_FALLBACK_PORT must be set when fallback host is set")
            fallback = ("fallback", self.stream_load_fallback_host, int(self.stream_load_fallback_port))
            if fallback[1:] not in [(host, port) for _, host, port in targets]:
                targets.append(fallback)
        for _, _, port in targets:
            if not 1 <= int(port) <= 65535:
                raise ConfigError(f"Stream Load port must be between 1 and 65535, got {port}")
        return targets


def load_env_safe() -> None:
    """
    安全加载 .env 文件

    如果 python-dotenv 不可用或 .env 文件不存在，静默跳过
    """
    try:
        from dotenv import load_dotenv
    except ImportError:
        return

    script_path = Path(__file__).resolve()
    skill_env = script_path.parents[1] / ".env"
    project_env = script_path.parents[4] / ".env"
    for env_path in (project_env, skill_env):
        if env_path.exists():
            load_dotenv(dotenv_path=env_path, override=False)
