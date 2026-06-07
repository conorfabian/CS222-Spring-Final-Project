# Proposal Source Notes

## Topic

This proposal is about predicting NBA player injury risk from public data with interpretable machine learning.

## Main Sources

1. Cohan, Schuster, and Fernandez. *A deep learning approach to injury forecasting in NBA basketball* (2021).  
   Link: https://journals.sagepub.com/doi/10.3233/JSA-200529  
   Why I used it: This is the clearest NBA injury forecasting paper I found that uses a deep learning approach and public data. It also says the data is noisy and incomplete, which matters for my assumptions.

2. Lu et al. *Machine Learning for Predicting Lower Extremity Muscle Strain in National Basketball Association Athletes* (2022).  
   Link: https://journals.sagepub.com/doi/10.1177/23259671221111742  
   Why I used it: This gives me a strong NBA example where an interpretable model family matters. The paper reports that XGBoost outperformed logistic regression and used metrics like AUROC, calibration, and Brier score.

3. Yuan et al. *Machine learning applications in sports injury prediction: A narrative review* (2025).  
   Link: https://journals.sagepub.com/doi/10.1177/00368504251385956  
   Why I used it: This helps support the broader claim that sports injury prediction research still has inconsistent preprocessing, feature selection, and evaluation practice.

4. *An Overview of Machine Learning Applications in Sports Injury Prediction* (review article, 2023).  
   Link: https://pmc.ncbi.nlm.nih.gov/articles/PMC10613321/  
   Why I used it: This review says the field still lacks open uniform datasets and strong standard evaluation practice. That supports why a careful public-data proposal is still useful.

## Novelty Note

My novelty claim is limited. I am not claiming a new deep learning model. I am claiming that a public-data-only NBA injury study can be more useful if it compares interpretable baselines against a simple neural baseline and reports calibration, errors, and assumptions clearly.

## Evaluation Note

The evaluation plan in the proposal uses concrete tests:

- AUROC
- precision
- recall
- F1
- Brier score
- calibration
- false positives and false negatives
- baseline comparison
- ablation
- subgroup checks

## Assumptions

- Public injury data is noisy and may miss details that teams keep private.
- The proposal should make cautious claims because private biometric data is not available.
- If the broad injury target is too noisy, the scope may need to narrow to a more stable time-loss label or injury subtype.

## Figure Note

The proposal figure is a workflow diagram. It shows how public data moves into feature engineering, model comparison, evaluation, and a small revision loop. The Mermaid source is in `proposal/figure_workflow.mmd`, and a rendered SVG is in `proposal/figure_workflow.svg`.
