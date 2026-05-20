package com.skinclinic.domain.member.controller;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import com.skinclinic.domain.member.dto.MemberInfoDto;
import com.skinclinic.domain.member.dto.MemberPasswordUpdateDto;
import com.skinclinic.domain.member.dto.MemberSignUpDto;
import com.skinclinic.domain.member.dto.MemberUpdateDto;
import com.skinclinic.domain.member.service.MemberService;
import com.skinclinic.global.auth.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

@Controller
@RequiredArgsConstructor
@RequestMapping("/members")
public class MemberController {
    private final MemberService memberService;

    @GetMapping("/signup")
    public String signUpForm(Model model){
        model.addAttribute("memberSignUpDto", new MemberSignUpDto());
        return "member/signup";
    }
    @PostMapping("/signup")
    public String signUp(@Valid MemberSignUpDto memberSignUpDto, BindingResult bindingResult,Model model){
        if(bindingResult.hasErrors()){
            return"member/signup";
        }
        try{
            memberService.signUp(memberSignUpDto);
        }catch (IllegalArgumentException e){
            model.addAttribute("errorMessage", e.getMessage());
            return "member/signup";
        }
        return "redirect:/";
    }
    @GetMapping("/login")
    public String loginForm(@RequestParam(value = "error",required = false)String error,
                            Model model){
        if(error != null){
            model.addAttribute("errorMessage","아이디 또는 비밀번호가 올바르지 않습니다.");
        }
        return "member/login";
    }
    @GetMapping("/mypage")
    public String myPage(@AuthenticationPrincipal CustomUserDetails userDetails, Model model) {
        if (userDetails != null) {
            MemberInfoDto memberInfo = memberService.getMyInfo(userDetails.getUsername());
            model.addAttribute("member", memberInfo);
        }
        return "mypage/index";
    }
    @GetMapping("/edit")
    public String editForm(@AuthenticationPrincipal CustomUserDetails userDetails, Model model) {
        MemberUpdateDto memberUpdateDto = memberService.getMyInfoForUpdate(userDetails.getUsername());
        model.addAttribute("memberUpdateDto", memberUpdateDto);
        return "member/edit";
    }

    /* 수정 */
    @PostMapping("/edit")
    public String edit(@AuthenticationPrincipal CustomUserDetails userDetails,
                       @Valid @ModelAttribute MemberUpdateDto memberUpdateDto,
                       BindingResult bindingResult,
                       Model model,
                       RedirectAttributes redirectAttributes) {
        if (bindingResult.hasErrors()) {
            return "member/edit";
        }

        try {
            memberService.updateMyInfo(userDetails.getUsername(), memberUpdateDto);
        } catch (IllegalArgumentException e) {
            model.addAttribute("errorMessage", e.getMessage());
            return "member/edit";
        }
        redirectAttributes.addFlashAttribute("successMessage","수정되었습니다.");
        return "redirect:/members/mypage";
    }
    @GetMapping("/password")
    public String passwordForm(Model model){
        model.addAttribute("passwordDto", new MemberPasswordUpdateDto());
        return "member/password";
    }
    @PostMapping("/password")
    public String changePassword(@AuthenticationPrincipal CustomUserDetails userDetails,
                                 @Valid @ModelAttribute("passwordDto") MemberPasswordUpdateDto dto,
                                 BindingResult bindingResult,
                                 Model model,
                                 RedirectAttributes redirectAttributes){

        if(bindingResult.hasErrors()){
            return "member/password";
        }
        // 새 비밀번호 확인 검사
        if(!dto.getNewPassword().equals(dto.getConfirmPassword())){
            model.addAttribute("errorMessage","새 비밀번호가 일치하지 않습니다.");
            return "member/password";
        }

        try{
            memberService.changePassword(userDetails.getUsername(), dto);
        }catch (IllegalArgumentException e){
            model.addAttribute("errorMessage", e.getMessage());
            return "member/password";
        }
        redirectAttributes.addFlashAttribute("successMessage","비밀번호가 변경되었습니다.");
        return "redirect:/members/mypage";
    }
    @PostMapping("/email/send")
    @ResponseBody
    public String sendEmailCode(@RequestParam String email){
        try {
            memberService.sendEmailCode(email);
            return "success";
        } catch (IllegalArgumentException e) {
            return e.getMessage();
        } catch (Exception e) {
            return "이메일 전송에 실패했습니다.";
        }
    }
    @PostMapping("/email/verify")
    @ResponseBody
    public boolean verifyEmail(@RequestParam String email,
                               @RequestParam String code) {
        return memberService.verifyEmail(email, code);
    }

}
