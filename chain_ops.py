"""
chain_ops.py — CBT chain inspection for API and UI.
"""

import re

from backup_manifest import (
    load_chain,
    load_manifest,
    point_rel,
    walk_chain_to_point,
)


POINT_ID_RE = re.compile(r"^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$")


def format_point_id(point_id):
    m = POINT_ID_RE.match(point_id or "")
    if m:
        y, mo, d, h, mi, _s = m.groups()
        return f"{y}-{mo}-{d} {h}:{mi}"
    return point_id


def type_label(point_type):
    labels = {
        "full": "Full",
        "incremental": "Incremental",
        "synthetic_full": "Synthetic full",
    }
    return labels.get(point_type, point_type or "Unknown")


def type_color(point_type):
    colors = {
        "full": "#3b82f6",
        "incremental": "#10b981",
        "synthetic_full": "#8b5cf6",
    }
    return colors.get(point_type, "#6b7280")


def get_vm_chain_view(storage, vm_name):
    """Return chain timeline for UI, or None if no chain."""
    chain = load_chain(storage, vm_name)
    if not chain or not chain.get("points"):
        return None

    points = []
    for idx, pt in enumerate(chain.get("points", [])):
        pt_id = pt["id"]
        pt_dir = point_rel(vm_name, pt_id)
        manifest = load_manifest(storage, vm_name, pt_id) or {}
        size_bytes = storage.get_size(pt_dir) if storage.exists(pt_dir) else 0
        if size_bytes > 1024 ** 3:
            size_str = f"{size_bytes / (1024 ** 3):.2f} GB"
        elif size_bytes > 1024 ** 2:
            size_str = f"{size_bytes / (1024 ** 2):.2f} MB"
        else:
            size_str = f"{size_bytes / 1024:.1f} KB" if size_bytes else "—"

        chain_path = walk_chain_to_point(chain, pt_id)
        depth = len(chain_path) - 1

        points.append({
            "id": pt_id,
            "display_date": format_point_id(pt_id),
            "type": pt.get("type") or manifest.get("type", "full"),
            "type_label": type_label(pt.get("type") or manifest.get("type")),
            "parent": pt.get("parent"),
            "timestamp": pt.get("timestamp") or manifest.get("timestamp"),
            "size": size_str,
            "size_bytes": size_bytes,
            "depth": depth,
            "is_latest": pt_id == chain.get("latest"),
            "path": pt_dir,
        })

    return {
        "vm_name": vm_name,
        "chain_id": chain.get("chain_id"),
        "latest": chain.get("latest"),
        "point_count": len(points),
        "points": points,
    }


def list_all_chains(storage):
    """Scan repo for VMs with CBT chains."""
    chains = []
    try:
        for vm_name in storage.list_dirs(""):
            view = get_vm_chain_view(storage, vm_name)
            if view:
                chains.append(view)
    except Exception:
        pass
    return chains
