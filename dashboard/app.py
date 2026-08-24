import streamlit as st
import json
from pathlib import Path

st.set_page_config(page_title="AlignBench", layout="wide")
st.title("AlignBench - AI Alignment Evaluation Dashboard")

results_dir = Path("results/runs")
json_files = sorted(results_dir.glob("*.json"), reverse=True)

if not json_files:
    st.warning("No results found. Run the benchmark first.")
    st.stop()

selected = st.selectbox("Select a run", [f.name for f in json_files])
data = json.loads(json_files[json_files.index(results_dir / selected)].read_text(encoding="utf-8-sig"))

if not data:
    st.warning("This run has no results (all calls may have timed out).")
    st.stop()

st.metric("Total Scored", len(data))

dimensions = {}
for r in data:
    dim = r["dimension"]
    if dim not in dimensions:
        dimensions[dim] = []
    dimensions[dim].append(r["judge_score"])

col1, col2 = st.columns(2)

with col1:
    st.subheader("Scores by Dimension")
    for dim, scores in sorted(dimensions.items()):
        avg = sum(scores) / len(scores)
        st.write(f"**{dim}**: {avg:.2f} ({len(scores)} cases)")
        st.progress(min(avg / 5.0, 1.0))

with col2:
    st.subheader("Heuristic Flags")
    all_flags = []
    for r in data:
        all_flags.extend(r.get("heuristic_flags", []))
    if all_flags:
        flag_counts = {}
        for f in all_flags:
            name = f.split(":")[0] if ":" in f else f
            flag_counts[name] = flag_counts.get(name, 0) + 1
        for flag, count in sorted(flag_counts.items(), key=lambda x: -x[1]):
            st.write(f"- {flag}: {count}")
    else:
        st.write("No flags detected.")

st.subheader("Individual Results")
st.dataframe(
    data,
    column_order=["test_case_id", "dimension", "judge_score", "heuristic_score", "disagreement", "latency_seconds"],
    column_config={
        "judge_score": st.column_config.ProgressColumn("Judge", format="%.1f", min_value=1, max_value=5),
        "heuristic_score": st.column_config.ProgressColumn("Heuristic", format="%.1f", min_value=1, max_value=5),
    },
    use_container_width=True,
    hide_index=True,
)
