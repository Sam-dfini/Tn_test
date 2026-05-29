#!/usr/bin/env python3
"""Upload Core_Concept doctrine files to AnythingLLM workspaces."""

import json
import os
import sys
import time
import requests

API_BASE = "https://llm.kilma.ai/api/v1"
API_KEY = "YOUR_ANYTHINGLLM_API_KEY"
STAGING = "/home/davey/Desktop/tunisiaintel v2/Tn_test/anythingllm_upload"
HEADERS = {"Authorization": f"Bearer {API_KEY}"}


def upload_file(filepath):
    """Upload a single file to AnythingLLM. Returns document ID."""
    url = f"{API_BASE}/document/upload"
    with open(filepath, "rb") as f:
        resp = requests.post(url, headers=HEADERS, files={"file": f})
    if resp.status_code != 200:
        print(f"  FAIL upload ({resp.status_code}): {os.path.basename(filepath)}")
        return None
    data = resp.json()
    if data.get("success") and data.get("documents"):
        doc_id = data["documents"][0]["id"]
        return doc_id
    print(f"  FAIL upload (no doc returned): {os.path.basename(filepath)}")
    return None


def add_to_workspace(doc_ids, workspace_slug):
    """Link documents to a workspace."""
    url = f"{API_BASE}/workspace/{workspace_slug}/update-embeddings"
    payload = {"adds": doc_ids, "deletes": []}
    resp = requests.post(url, headers={**HEADERS, "Content-Type": "application/json"}, json=payload)
    if resp.status_code != 200:
        print(f"  FAIL workspace link ({resp.status_code}): {workspace_slug}")
        return False
    return True


def upload_workspace(ws_name, ws_slug, tier_zero_files=None):
    """Upload all .md files in a workspace folder.

    tier_zero_files: optional list of filenames to upload first (in order).
    """
    ws_dir = os.path.join(STAGING, ws_name)
    if not os.path.isdir(ws_dir):
        print(f"SKIP: {ws_name} — no staging dir")
        return

    files = sorted([f for f in os.listdir(ws_dir) if f.endswith(".md")])
    if not files:
        print(f"SKIP: {ws_name} — no .md files")
        return

    # Order: tier_zero first (in given order), then rest alphabetically
    ordered = []
    remaining = list(files)
    if tier_zero_files:
        for tzf in tier_zero_files:
            if tzf in remaining:
                ordered.append(tzf)
                remaining.remove(tzf)
    ordered += sorted(remaining)

    print(f"\n{'='*60}")
    print(f"WORKSPACE: {ws_name} ({ws_slug}) — {len(ordered)} files")
    print(f"{'='*60}")

    doc_ids = []
    for i, fname in enumerate(ordered, 1):
        fpath = os.path.join(ws_dir, fname)
        if not os.path.isfile(fpath):
            continue
        print(f"  [{i}/{len(ordered)}] Uploading: {fname}")
        doc_id = upload_file(fpath)
        if doc_id:
            doc_ids.append(doc_id)
        # Small delay between uploads
        time.sleep(0.5)

    if doc_ids:
        print(f"  Linking {len(doc_ids)} docs to workspace '{ws_slug}'...")
        if add_to_workspace(doc_ids, ws_slug):
            print(f"  Done — {len(doc_ids)} docs sent to {ws_name}")
    else:
        print(f"  No docs uploaded for {ws_name}")


def main():
    # Tier Zero: Claude's priority order
    # These are mapped to their respective workspaces
    tier_zero = {
        "Political_Dynamics": [
            "Preference_Falsification.md",
            "Elite_Cohesion.md",
            "Collective_Action.md",
            "Regime_Durability.md",
        ],
        "RRI_Engine": [
            "Threshold_Activation.md",
        ],
        "Systems_Theory": [
            "Cascade_Dynamics.md",
            "Nonlinear_Escalation.md",
        ],
        "Cognitive_Warfare": [
            "Narrative_Amplification.md",
        ],
    }

    # Phase A — Tier Zero: upload in priority order across workspaces
    print("\n" + "█"*60)
    print("PHASE A: TIER ZERO — Priority doctrine files")
    print("█"*60)

    # Upload Tier Zero files one at a time in Claude's specified order
    tier_zero_order = [
        ("Political_Dynamics", "Preference_Falsification.md"),
        ("RRI_Engine", "Threshold_Activation.md"),
        ("Systems_Theory", "Cascade_Dynamics.md"),
        ("Political_Dynamics", "Elite_Cohesion.md"),
        ("Cognitive_Warfare", "Narrative_Amplification.md"),
        ("Political_Dynamics", "Collective_Action.md"),
        ("Political_Dynamics", "Regime_Durability.md"),
        ("Systems_Theory", "Nonlinear_Escalation.md"),
    ]

    tier_doc_ids = {}
    for ws_name, fname in tier_zero_order:
        ws_slug = ws_name.lower().replace(" ", "_")
        ws_dir = os.path.join(STAGING, ws_name)
        fpath = os.path.join(ws_dir, fname)
        if not os.path.isfile(fpath):
            print(f"  SKIP (not found): {ws_name}/{fname}")
            continue
        print(f"\n  Tier Zero [{fname}] → {ws_name}")
        doc_id = upload_file(fpath)
        if doc_id:
            tier_doc_ids.setdefault(ws_slug, []).append(doc_id)
        time.sleep(1)

    # Link Tier Zero docs to their workspaces
    for ws_slug, doc_ids in tier_doc_ids.items():
        print(f"  Linking Tier Zero docs to '{ws_slug}'...")
        add_to_workspace(doc_ids, ws_slug)
        time.sleep(2)

    # Phase B — Rest of TunisiaIntel_Core (the remaining .md files)
    print("\n" + "█"*60)
    print("PHASE B: TUNISIAINTEL_CORE — Full proprietary doctrine")
    print("█"*60)
    upload_workspace("TunisiaIntel_Core", "tunisiaintel_core")

    # Phase C — Remaining workspaces
    print("\n" + "█"*60)
    print("PHASE C: REMAINING WORKSPACES")
    print("█"*60)
    upload_workspace("Political_Dynamics", "political_dynamics")
    upload_workspace("Systems_Theory", "systems_theory")
    upload_workspace("Cognitive_Warfare", "cognitive_warfare")
    upload_workspace("Foundation_Intelligence", "foundation_intelligence")
    upload_workspace("RRI_Engine", "rri_engine")

    print("\n" + "★"*60)
    print("UPLOAD COMPLETE")
    print("★"*60)
    print("\nNext steps:")
    print("  1. Go to AnythingLLM UI → check each workspace has its documents")
    print("  2. Configure system prompts per workspace (from Upload Guide)")
    print("  3. Test retrieval with verification queries")
    print("  4. Upload PDFs in phases (Wave 2 → Core Thinkers, Wave 3 → Heavy docs)")


if __name__ == "__main__":
    main()
