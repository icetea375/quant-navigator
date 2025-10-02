<template>
  <el-dialog
    :model-value="visible"
    title="仲裁决策"
    width="600px"
    :before-close="handleDialogClose"
    @update:model-value="handleDialogClose"
    data-testid="arbitration-decision-dialog"
  >
    <div class="arbitration-form">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item
          label="决策类型"
          prop="decision"
        >
          <el-radio-group v-model="form.decision">
            <el-radio value="approve">
              通过
            </el-radio>
            <el-radio value="reject">
              拒绝
            </el-radio>
            <el-radio value="pending">
              待定
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item
          label="优先级"
          prop="priority"
        >
          <el-select
            v-model="form.priority"
            placeholder="请选择优先级"
          >
            <el-option
              label="高"
              value="high"
            />
            <el-option
              label="中"
              value="medium"
            />
            <el-option
              label="低"
              value="low"
            />
          </el-select>
        </el-form-item>

        <el-form-item
          label="决策理由"
          prop="reasoning"
        >
          <el-input
            v-model="form.reasoning"
            type="textarea"
            :rows="4"
            placeholder="请输入决策理由..."
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="form.notes"
            type="textarea"
            :rows="2"
            placeholder="可选：添加额外备注..."
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="submitting"
          @click="handleSubmit"
        >
          提交决策
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { logger } from "@/utils/logger"
import type { FormInstance, FormRules } from 'element-plus'

// ==================== Props ====================
interface Props {
  visible: boolean
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  submitting: false
})

// ==================== Emits ====================
interface Emits {
  (e: 'update:visible', visible: boolean): void
  (e: 'submit', form: ArbitrationForm): void
  (e: 'cancel'): void
}

const emit = defineEmits<Emits>()

// ==================== Types ====================
interface ArbitrationForm {
  decision: 'approve' | 'reject' | 'pending'
  priority: 'high' | 'medium' | 'low'
  reasoning: string
  notes: string
}

// ==================== Data ====================
const formRef = ref<FormInstance>()

const form = reactive<ArbitrationForm>({
  decision: 'approve',
  priority: 'medium',
  reasoning: '',
  notes: ''
})

const rules: FormRules = {
  decision: [
    { required: true, message: '请选择决策类型', trigger: 'change' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ],
  reasoning: [
    { required: true, message: '请输入决策理由', trigger: 'blur' },
    { min: 10, message: '决策理由至少10个字符', trigger: 'blur' }
  ]
}

// ==================== Methods ====================
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    emit('submit', { ...form })
  } catch (error) {
    logger.error('表单验证失败:', error)
  }
}

const handleCancel = () => {
  emit('cancel')
}

const handleDialogClose = () => {
  emit('update:visible', false)
}

// ==================== Watchers ====================
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    // 重置表单
    form.decision = 'approve'
    form.priority = 'medium'
    form.reasoning = ''
    form.notes = ''
  }
})
</script>

<style scoped>
.arbitration-form {
  padding: 16px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
